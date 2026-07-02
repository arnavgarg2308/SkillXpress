import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

print("Loading base model...")
base_model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto"
)

print("Loading LoRA adapter...")
model = PeftModel.from_pretrained(base_model, "./adapter")

messages = [
    {
        "role": "user",
        "content": """
Generate a personalized career roadmap for the following student:

{
  "primaryRole": "AI Engineer",
  "level": "Beginner",
  "overallProgress": 35,
  "currentSkills": {
    "Python": 60,
    "Machine Learning": 35,
    "Deep Learning": 20,
    "TensorFlow": 15
  },
  "requiredSkills": {
    "Python": 85,
    "Machine Learning": 85,
    "Deep Learning": 80,
    "TensorFlow": 80
  }
}
"""
    }
]

prompt = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True
)

inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

print("\nGenerating roadmap...\n")

output = model.generate(
    **inputs,
    max_new_tokens=600,
    temperature=0.7,
    do_sample=True,
)

response = tokenizer.decode(output[0], skip_special_tokens=True)

print("=" * 80)
print(response)
print("=" * 80)