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

Generate ONE personalized roadmap for ONE MONTH.

The backend has already selected the correct skills and topics.

You MUST follow the backend exactly.

====================================================

INPUT

- primaryRole
- month
- currentSkills
- requiredSkills
- roadmapTopics

roadmapTopics contains:

- skill
- level
- recommendedTopics

====================================================

STRICT RULES

1. Teach ONLY the recommendedTopics.

2. Never introduce any topic that is NOT listed inside recommendedTopics.

3. Do NOT teach beginner topics for ADVANCED skills.

4. Follow the level exactly.

BEGINNER:
Teach fundamentals only.

INTERMEDIATE:
Teach practical implementation and projects.

ADVANCED:
Teach optimization, architecture, debugging, best practices and interview concepts only.

5. Keep study time around 2.5 hours/day.

6. Difficulty must increase every week.

====================================================

OUTPUT FORMAT

Generate EXACTLY FOUR WEEKS.

Do NOT skip any week.

Do NOT merge weeks.

Every week MUST exist.

WEEK 1

Focus

Daily Plan
(Day 1 to Day 7)

--------------------------------

WEEK 2

Focus

Daily Plan
(Day 1 to Day 7)

--------------------------------

WEEK 3

Focus

Daily Plan
(Day 1 to Day 7)

--------------------------------

WEEK 4

Focus

Daily Plan
(Day 1 to Day 7)

--------------------------------

Finally generate exactly ONE MINI PROJECT.

Format:

Project Title

What to Build

Tech Stack

Expected Outcome

====================================================

Output ONLY the roadmap.

Do NOT explain anything.

If any week is missing, regenerate internally before answering.
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