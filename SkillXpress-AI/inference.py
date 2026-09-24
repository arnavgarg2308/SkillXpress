import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel


# ==========================================================
# MODEL CONFIGURATION
# ==========================================================

MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"
ADAPTER_PATH = "./adapter"


# ==========================================================
# ROADMAP GENERATOR
# ==========================================================

class RoadmapGenerator:

    def __init__(self):

        print("=" * 80)
        print("🚀 Loading SkillXpress AI")
        print("=" * 80)

        # --------------------------------------------------
        # TOKENIZER
        # --------------------------------------------------

        print("Loading tokenizer...")

        self.tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME
        )

        # --------------------------------------------------
        # BASE MODEL
        # --------------------------------------------------

        print("Loading base model...")

        self.base_model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=(
                torch.float16
                if torch.cuda.is_available()
                else torch.float32
            ),
            device_map="auto"
        )

        # --------------------------------------------------
        # LORA ADAPTER
        # --------------------------------------------------

        print("Loading LoRA adapter...")

        self.model = PeftModel.from_pretrained(
            self.base_model,
            ADAPTER_PATH
        )

        # --------------------------------------------------
        # EVALUATION MODE
        # --------------------------------------------------

        self.model.eval()

        print("✅ AI Model Loaded Successfully")

        # --------------------------------------------------
        # DEVICE
        # --------------------------------------------------

        print(
            "Device:",
            next(self.model.parameters()).device
        )

        print("=" * 80)

    # ======================================================
    # GENERATE ROADMAP
    # ======================================================

    def generate(self, system_prompt, user_prompt):

        # --------------------------------------------------
        # QWEN CHAT FORMAT
        # --------------------------------------------------

        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ]

        # --------------------------------------------------
        # APPLY QWEN CHAT TEMPLATE
        # --------------------------------------------------

        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        # --------------------------------------------------
        # TOKENIZE
        # --------------------------------------------------

        inputs = self.tokenizer(
            text,
            return_tensors="pt"
        )

        # --------------------------------------------------
        # MOVE INPUT TO MODEL DEVICE
        # --------------------------------------------------

        inputs = {
            key: value.to(self.model.device)
            for key, value in inputs.items()
        }

        # --------------------------------------------------
        # INPUT TOKEN LENGTH
        # --------------------------------------------------

        input_length = inputs["input_ids"].shape[1]

        print("=" * 80)
        print("🤖 GENERATING ROADMAP")
        print("Input tokens:", input_length)
        print("=" * 80)

        # --------------------------------------------------
        # GENERATION
        # --------------------------------------------------

        with torch.no_grad():

            output = self.model.generate(
                **inputs,

                # --------------------------------------------------
                # OUTPUT LENGTH
                # --------------------------------------------------
                # 28 days + detailed tasks need a large output.
                # min_new_tokens prevents very early stopping.
                # --------------------------------------------------

                min_new_tokens=1200,
                max_new_tokens=2100,

                # --------------------------------------------------
                # GENERATION CONTROL
                # --------------------------------------------------

                temperature=0.2,
                top_p=0.9,

                # Sampling
                do_sample=True,

                # Reduce repetition
                repetition_penalty=1.08,

                # --------------------------------------------------
                # PADDING
                # --------------------------------------------------

                pad_token_id=(
                    self.tokenizer.pad_token_id
                    if self.tokenizer.pad_token_id is not None
                    else self.tokenizer.eos_token_id
                ),

                # --------------------------------------------------
                # END OF SEQUENCE
                # --------------------------------------------------

                eos_token_id=self.tokenizer.eos_token_id
            )

        # --------------------------------------------------
        # ONLY DECODE NEWLY GENERATED TOKENS
        # --------------------------------------------------

        generated_tokens = output[0][input_length:]

        response = self.tokenizer.decode(
            generated_tokens,
            skip_special_tokens=True
        ).strip()

        # --------------------------------------------------
        # CLEAN MARKDOWN JSON FENCE
        # --------------------------------------------------

        if response.startswith("```json"):

            response = response[len("```json"):].strip()

        elif response.startswith("```"):

            response = response[3:].strip()

        if response.endswith("```"):

            response = response[:-3].strip()

        # --------------------------------------------------
        # REMOVE TEXT BEFORE JSON
        # --------------------------------------------------
        # Example:
        #
        # "Here is your roadmap:
        # {
        #   ...
        # }"
        #
        # We keep only the JSON part.
        # --------------------------------------------------

        start = response.find("{")

        if start != -1:

            response = response[start:]

        # --------------------------------------------------
        # FINAL CLEANUP
        # --------------------------------------------------

        response = response.strip()

        print("=" * 80)
        print("✅ ROADMAP GENERATION COMPLETED")
        print("Output tokens:", len(generated_tokens))
        print("=" * 80)

        return response


# ==========================================================
# CREATE MODEL INSTANCE
# ==========================================================

generator = RoadmapGenerator()