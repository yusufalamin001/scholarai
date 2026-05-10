"""
loader.py
---------
WHAT: Selects the right system prompt based on a student's faculty.
WHY:  This single function is what makes ScholarAI discipline-aware.
      The rest of the pipeline stays identical — only the prompt changes.

HOW TO EXTEND:
  To add a new faculty, create a new prompt file (e.g. sciences.py)
  and add it to PROMPT_MAP below.
"""

from prompts.engineering import ENGINEERING_PROMPT
from prompts.law import LAW_PROMPT
from prompts.medicine import MEDICINE_PROMPT
from prompts.business import BUSINESS_PROMPT
from prompts.general import GENERAL_PROMPT

PROMPT_MAP: dict[str, str] = {
    "engineering": ENGINEERING_PROMPT,
    "sciences": ENGINEERING_PROMPT,    # Sciences shares engineering prompt
    "law": LAW_PROMPT,
    "medicine": MEDICINE_PROMPT,
    "health sciences": MEDICINE_PROMPT,
    "business": BUSINESS_PROMPT,
    "management": BUSINESS_PROMPT,
    "general": GENERAL_PROMPT,
}


def get_prompt(faculty: str) -> str:
    """
    Returns the appropriate system prompt for a given faculty string.
    Falls back to GENERAL_PROMPT if the faculty is not recognised.

    Args:
        faculty: Student's faculty (case-insensitive string)

    Returns:
        System prompt string to pass to Claude

    Examples:
        get_prompt("engineering")  → ENGINEERING_PROMPT
        get_prompt("Law")          → LAW_PROMPT
        get_prompt("Geography")    → GENERAL_PROMPT (fallback)
    """
    return PROMPT_MAP.get(faculty.lower().strip(), GENERAL_PROMPT)
