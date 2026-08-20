import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel


MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"
ADAPTER_PATH = "./adapter"


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

        # Move input tensors to model device
        inputs = {
            key: value.to(self.model.device)
            for key, value in inputs.items()
        }

        # Number of input tokens
        input_length = inputs["input_ids"].shape[1]

        # --------------------------------------------------
        # GENERATION
        # --------------------------------------------------

        with torch.no_grad():

            output = self.model.generate(
                **inputs,

                # 28 daily plans need enough output space
                max_new_tokens=1800,

                # Controlled creativity
                temperature=0.5,
                top_p=0.8,

                # Sampling
                do_sample=True,

                # Reduce unnecessary repetition
                repetition_penalty=1.05,

                # Prevent padding issues
                pad_token_id=(
                    self.tokenizer.pad_token_id
                    if self.tokenizer.pad_token_id is not None
                    else self.tokenizer.eos_token_id
                ),

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

        return response


# ==========================================================
# CREATE MODEL INSTANCE
# ==========================================================

generator = RoadmapGenerator()