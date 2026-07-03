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

Generate ONLY one personalized roadmap for ONE month.

The input contains:
- primaryRole
- month
- currentSkills
- requiredSkills
- roadmapTopics

roadmapTopics is already prepared by the backend.

IMPORTANT RULES

1. Use ONLY the topics inside roadmapTopics.

2. Never introduce any topic that is NOT present in roadmapTopics.

3. Do NOT teach skills that are already mastered.

4. Follow the difficulty level provided for each skill:
   - BEGINNER → fundamentals, simple exercises, basic project.
   - INTERMEDIATE → practical implementation, projects, deeper concepts.
   - ADVANCED → optimization, architecture, debugging, best practices, interview preparation.

5. Keep the roadmap realistic for 2.5 hours of study per day.

6. Increase difficulty gradually every week.

7. Do not explain your reasoning.

Return ONLY in this format:

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