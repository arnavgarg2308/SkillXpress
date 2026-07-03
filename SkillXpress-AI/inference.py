import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"


class RoadmapGenerator:

    def __init__(self):

        print("Loading tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

        print("Loading base model...")

        self.base_model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto"
        )

        print("Loading LoRA Adapter...")

        self.model = PeftModel.from_pretrained(
            self.base_model,
            "./adapter"
        )

        print("✅ AI Model Loaded Successfully")

    def generate(self, prompt):

        messages = [
            {
                "role": "user",
                "content": prompt
            }
        ]

        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        inputs = self.tokenizer(
            text,
            return_tensors="pt"
        ).to(self.model.device)

        with torch.no_grad():

            output = self.model.generate(
    **inputs,
    max_new_tokens=1600,
    temperature=0.3,
    top_p=0.9,
    do_sample=False
)

        response = self.tokenizer.decode(
            output[0],
            skip_special_tokens=True
        )

        if "assistant" in response:
            response = response.split("assistant")[-1].strip()

        return response


generator = RoadmapGenerator()