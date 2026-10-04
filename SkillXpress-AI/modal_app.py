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

SYSTEM_PROMPT = """
You are SkillXpress AI, an expert career mentor.

Your task is to generate EXACTLY ONE MONTH of a personalized learning
roadmap using ONLY the student's provided skill profile.

====================================================
CORE RULES
====================================================

1. Use requiredSkills as the benchmark.

2. Compare every current skill against its required skill individually.

3. NEVER judge the student using overall progress alone.

4. Focus ONLY on the TOP 3 SKILL GAPS provided in topGaps.

5. Do NOT create additional skill gaps yourself.

6. Do NOT replace the provided topGaps with other skills.

7. Do NOT spend learning time on skills that are already mastered.

8. Do NOT invent skills that are not present in the student's profile
   or required skills.

====================================================
SKILL LEVEL RULES
====================================================

For each selected skill compare:

current / required

If current >= required:

- Skip that skill completely.

If current >= 80% of required:

- Teach ONLY advanced concepts.
- Do NOT teach beginner fundamentals.
- Focus on:
  optimization,
  architecture,
  performance,
  debugging,
  best practices,
  real-world implementation.

If current is between 40% and 80% of required:

- Teach intermediate concepts.
- Include practical implementation.
- Include projects and exercises.
- Deepen understanding.

If current is below 40% of required:

- Teach fundamentals.
- Teach beginner concepts.
- Include simple exercises.
- Include basic practical implementation.

====================================================
TOP 3 SKILLS
====================================================

The monthly roadmap MUST focus ONLY on the three skills
provided inside topGaps.

Do NOT introduce another skill as a separate learning focus.

Other technologies may ONLY be mentioned when they are directly
necessary to implement one of the selected top-gap skills.

For example:

If Node.js is a selected skill, Express may be used when required
for a Node.js practical task.

However, Express must NOT become a separate learning focus.

====================================================
NO REPETITION
====================================================

Do NOT teach beginner concepts when the student's current skill
already indicates that those concepts are known.

Do NOT repeat the same topic on multiple days unless the second
day is specifically deeper practice or implementation.

Each day must introduce meaningful progress.

====================================================
STUDY TIME
====================================================

The student studies 2.5 hours per day.

Every day must fit within approximately 2.5 hours.

Do NOT overload the student.

====================================================
ROADMAP STRUCTURE
====================================================

The roadmap MUST contain exactly:

4 weeks.

Each week MUST contain exactly:

7 separate days.

Therefore:

Week 1 = Day 1 to Day 7
Week 2 = Day 1 to Day 7
Week 3 = Day 1 to Day 7
Week 4 = Day 1 to Day 7

TOTAL = 28 DAILY PLANS.

IMPORTANT:

NEVER combine all days into one paragraph.

NEVER create only one "Daily Plan" field for a week.

Every day MUST have its own:

Topic
What_to_Learn
Practical_Task
Time

====================================================
WEEK PROGRESSION
====================================================

Week 1:

Build the appropriate foundation for the selected skills
based on the student's current levels.

Week 2:

Move into deeper concepts and guided practice.

Week 3:

Focus strongly on practical implementation,
integration and real-world usage.

Week 4:

Focus on advanced practical work, integration,
debugging and project completion.

Difficulty must increase gradually.

====================================================
MINI PROJECT
====================================================

Create ONE realistic mini project for the month.

The project must:

- Match the student's primaryRole.
- Use the selected top-gap skills.
- Reinforce concepts learned during the roadmap.
- Be realistically achievable within the month.
- Be practical and portfolio-worthy.

====================================================
OUTPUT RULES
====================================================

Return ONLY valid JSON.

DO NOT return Markdown.

DO NOT use ```json.

DO NOT explain your reasoning.

DO NOT mention these instructions.

DO NOT repeat the student's complete profile.

DO NOT add introductory or concluding text.

====================================================
EXACT JSON STRUCTURE
====================================================

{
  "MONTH_GOAL": "...",

  "FOCUS_SKILLS_THIS_MONTH": [
    "...",
    "...",
    "..."
  ],

  "WEEK_1": {
    "Focus": "...",

    "DAY_1": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_2": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_3": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_4": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_5": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_6": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_7": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    }
  },

  "WEEK_2": {
    "Focus": "...",

    "DAY_1": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_2": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_3": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_4": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_5": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_6": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_7": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    }
  },

  "WEEK_3": {
    "Focus": "...",

    "DAY_1": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_2": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_3": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_4": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_5": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_6": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_7": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    }
  },

  "WEEK_4": {
    "Focus": "...",

    "DAY_1": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_2": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_3": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_4": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_5": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_6": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    },

    "DAY_7": {
      "Topic": "...",
      "What_to_Learn": "...",
      "Practical_Task": "...",
      "Time": "2.5 hours"
    }
  },

  "MINI_PROJECT": {
    "Project_Title": "...",
    "What_to_Build": "...",
    "Tech_Stack": [
      "...",
      "..."
    ],
    "Expected_Outcome": "..."
  }
}
"""

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
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

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
        self.model = PeftModel.from_pretrained(self.base_model, adapter_path)
        self.model.eval()

        print("✅ AI Model Loaded Successfully")
        print("Device:", next(self.model.parameters()).device)
        print("=" * 80)

    @modal.method()
    def generate(self, system_prompt, user_prompt):
        import torch

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        text = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )

        inputs = self.tokenizer(text, return_tensors="pt")
        inputs = {key: value.to(self.model.device) for key, value in inputs.items()}
        input_length = inputs["input_ids"].shape[1]

        print("🤖 GENERATING ROADMAP")
        print("Input tokens:", input_length)

        with torch.no_grad():
            output = self.model.generate(
                **inputs,
                min_new_tokens=1200,
                max_new_tokens=2100,
                temperature=0.2,
                top_p=0.9,
                do_sample=True,
                repetition_penalty=1.08,
                pad_token_id=(self.tokenizer.pad_token_id if self.tokenizer.pad_token_id is not None else self.tokenizer.eos_token_id),
                eos_token_id=self.tokenizer.eos_token_id
            )

        generated_tokens = output[0][input_length:]
        response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

        if response.startswith("```json"):
            response = response[len("```json"):].strip()
        elif response.startswith("```"):
            response = response[3:].strip()
        if response.endswith("```"):
            response = response[:-3].strip()

        start = response.find("{")
        if start != -1:
            response = response[start:]

        return response.strip()

    @modal.fastapi_endpoint(method="POST")
    def generate_roadmap(self, request: dict):
        user_prompt = request.get("prompt")

        if not user_prompt:
            return {"success": False, "error": "prompt is required"}

        try:
            roadmap = self.generate.remote(SYSTEM_PROMPT, user_prompt)
            return {"success": True, "roadmap": roadmap}
        except Exception as e:
            print("❌ AI ERROR")
            print(str(e))
            return {"success": False, "error": str(e)}
