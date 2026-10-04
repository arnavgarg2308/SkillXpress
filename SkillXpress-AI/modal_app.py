import os
import modal

MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"
ADAPTER_REPO = "arnavgarg2308/skillxpress-qwen-adapter"

app = modal.App("skillxpress-ai")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch",
        "transformers==4.56.2",
        "peft==0.17.1",
        "accelerate",
        "huggingface_hub==0.36.2",
        "fastapi"
    )
)

hf_secret = modal.Secret.from_name("huggingface-secret")


@app.cls(
    image=image,
    gpu="T4",
    timeout=900,
    secrets=[hf_secret],
    min_containers=0
)
class SkillXpressAI:

    @modal.enter()
    def load_model(self):

        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM
        from peft import PeftModel
        from huggingface_hub import snapshot_download

        print("=" * 80)
        print("🚀 Loading SkillXpress AI")
        print("=" * 80)

        print("Loading tokenizer...")

        self.tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME
        )

        print("Loading base model...")

        self.base_model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16,
            device_map="auto"
        )

        print("Downloading LoRA adapter...")

        adapter_path = snapshot_download(
            repo_id=ADAPTER_REPO,
            token=os.environ["HF_TOKEN"]
        )

        print("Loading LoRA adapter...")

        self.model = PeftModel.from_pretrained(
            self.base_model,
            adapter_path
        )

        self.model.eval()

        print("✅ AI Model Loaded Successfully")

        print(
            "Device:",
            next(self.model.parameters()).device
        )

        print("=" * 80)

    @modal.method()
    def generate(self, system_prompt, user_prompt):

        import torch

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

        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        inputs = self.tokenizer(
            text,
            return_tensors="pt"
        )

        inputs = {
            key: value.to(self.model.device)
            for key, value in inputs.items()
        }

        input_length = inputs["input_ids"].shape[1]

        print("=" * 80)
        print("🤖 GENERATING ROADMAP")
        print("Input tokens:", input_length)
        print("=" * 80)

        with torch.no_grad():

            output = self.model.generate(
                **inputs,
                min_new_tokens=1200,
                max_new_tokens=2100,
                temperature=0.2,
                top_p=0.9,
                do_sample=True,
                repetition_penalty=1.08,
                pad_token_id=(
                    self.tokenizer.pad_token_id
                    if self.tokenizer.pad_token_id is not None
                    else self.tokenizer.eos_token_id
                ),
                eos_token_id=self.tokenizer.eos_token_id
            )

        generated_tokens = output[0][input_length:]

        response = self.tokenizer.decode(
            generated_tokens,
            skip_special_tokens=True
        ).strip()

        if response.startswith("```json"):
            response = response[len("```json"):].strip()

        elif response.startswith("```"):
            response = response[3:].strip()

        if response.endswith("```"):
            response = response[:-3].strip()

        start = response.find("{")

        if start != -1:
            response = response[start:]

        response = response.strip()

        print("=" * 80)
        print("✅ ROADMAP GENERATION COMPLETED")
        print("Output tokens:", len(generated_tokens))
        print("=" * 80)

        return response

    @modal.fastapi_endpoint(method="POST")
    def generate_roadmap(self, request: dict):

        system_prompt = request.get("system_prompt")
        user_prompt = request.get("prompt")

        if not system_prompt:
            return {
                "success": False,
                "error": "system_prompt is required"
            }

        if not user_prompt:
            return {
                "success": False,
                "error": "prompt is required"
            }

        try:

            roadmap = self.generate.remote(
                system_prompt,
                user_prompt
            )

            return {
                "success": True,
                "roadmap": roadmap
            }

        except Exception as e:

            print("=" * 80)
            print("❌ AI ERROR")
            print("=" * 80)

            print(str(e))

            return {
                "success": False,
                "error": str(e)
            }