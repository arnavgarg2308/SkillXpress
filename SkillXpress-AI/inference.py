import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"


class RoadmapGenerator:

    def __init__(self):

        print("Loading tokenizer...")

        self.tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME
        )

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

        print("Loading LoRA Adapter...")

        self.model = PeftModel.from_pretrained(
            self.base_model,
            "./adapter"
        )

        self.model.eval()

        print("✅ AI Model Loaded Successfully")

    def generate(self, system_prompt, user_prompt):

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

        # Convert messages into Qwen chat format
        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        # Tokenize
        inputs = self.tokenizer(
            text,
            return_tensors="pt"
        )

        # Move tensors to model device
        inputs = {
            key: value.to(self.model.device)
            for key, value in inputs.items()
        }

        input_length = inputs["input_ids"].shape[1]

        with torch.no_grad():

            output = self.model.generate(
                **inputs,

                max_new_tokens=1800,

                temperature=0.5,
                top_p=0.8,

                do_sample=True,

                repetition_penalty=1.05,

                pad_token_id=self.tokenizer.eos_token_id
            )

        # IMPORTANT:
        # Decode ONLY newly generated tokens.
        generated_tokens = output[0][input_length:]

        response = self.tokenizer.decode(
            generated_tokens,
            skip_special_tokens=True
        ).strip()

        return response


generator = RoadmapGenerator()