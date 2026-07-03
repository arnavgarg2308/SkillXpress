from fastapi import FastAPI
from pydantic import BaseModel
from inference import generator
import uvicorn

app = FastAPI(
    title="SkillXpress AI",
    version="1.0"
)


class PromptRequest(BaseModel):
    prompt: str


SYSTEM_PROMPT = """
You are SkillXpress AI.

Generate ONLY a ONE MONTH personalized roadmap.

Use ONLY the provided student data.

Rules:

1. Compare currentSkills with requiredSkills.

2. Ignore any skill where current >= required.

3. Focus ONLY on the top 3 skill gaps.

4. If current < 40% of required:
Teach beginner fundamentals.

5. If current is 40% to 80% of required:
Teach intermediate concepts, projects and practical implementation.

6. If current > 80% of required:
Teach ONLY advanced concepts, optimization, debugging, architecture and interview preparation.

7. Never teach topics the student already knows.

8. Study time is 2.5 hours per day.

9. Keep difficulty increasing every week.

Return ONLY this format:

MONTH GOAL

FOCUS SKILLS THIS MONTH

WEEK 1
Focus:
Daily Plan:

WEEK 2
Focus:
Daily Plan:

WEEK 3
Focus:
Daily Plan:

WEEK 4
Focus:
Daily Plan:

MINI PROJECT

Project Title

What to Build

Tech Stack

Expected Outcome

Do not explain your reasoning.
Output only the roadmap.
"""


@app.get("/")
def home():
    return {
        "message": "SkillXpress AI Server Running"
    }


@app.post("/generate-roadmap")
def generate(request: PromptRequest):

    try:

        full_prompt = SYSTEM_PROMPT + "\n\nStudent Data:\n" + request.prompt
    
        print("=" * 80)
        print("FINAL PROMPT SENT TO MODEL")
        print("=" * 80)
        print(full_prompt)
        print("=" * 80)

        roadmap = generator.generate(full_prompt)

        return {
            "success": True,
            "roadmap": roadmap
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )