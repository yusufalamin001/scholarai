from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import json
import os

PLANNER_MODEL = "gemini-2.5-flash-lite"


def generate_study_plan(courses: list, exam_date: str, target_cgpa: float) -> dict:
    """
    Generates a weekly study schedule using Gemini.
    courses: list of {"name": str, "code": str}
    exam_date: ISO string e.g. "2026-06-15"
    target_cgpa: float e.g. 4.5
    """
    llm = ChatGoogleGenerativeAI(
        model=PLANNER_MODEL,
        google_api_key=os.environ["GOOGLE_API_KEY"]
    )

    course_list = "\n".join([f"- {c['name']} ({c['code']})" for c in courses])

    prompt = f"""You are a study schedule planner for Nigerian university students.

Generate a detailed weekly study plan as valid JSON only. No markdown, no explanation, just JSON.

Student details:
Courses:
{course_list}
Exam date: {exam_date}
Target CGPA: {target_cgpa}

Return JSON with this exact structure:
{{
  "exam_date": "{exam_date}",
  "total_weeks": <number of weeks from today to exam>,
  "weeks": [
    {{
      "week_number": 1,
      "theme": "Foundation and Introduction",
      "daily_study_hours": 4,
      "schedule": [
        {{
          "day": "Monday",
          "course": "<course name>",
          "topic": "<specific topic to study>",
          "hours": 2,
          "time_slot": "Morning"
        }}
      ]
    }}
  ],
  "study_tips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}}"""

    response = llm.invoke([HumanMessage(content=prompt)])
    text = response.content.strip()

    # Strip all possible markdown code block variations
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    # Find the first { and last } to extract just the JSON object
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        text = text[start:end+1]

    return json.loads(text)