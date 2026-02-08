from __future__ import annotations

from datetime import date
from typing import Literal, Optional, List
from pydantic import BaseModel, Field

NotesCategoryEnum = Literal[
    "General",
    "Administrative",
    "Secondary Procedure",
    "Communication",
    "Other",
]


class NoteEntry(BaseModel):
    title: Optional[str] = Field(
        default="General Note", description="Short subject line"
    )
    category: Optional[NotesCategoryEnum] = Field(
        default="Other", description="'Administrative', 'Communication', etc."
    )
    content: str = Field(description="Body of the note")
    note_date: Optional[date] = Field(default=None, description="Date of note taken")


class GeneralNotes(BaseModel):
    notes: List[NoteEntry] = Field(
        default_factory=list,
        description="Miscellaneous administrative or clinical notes",
    )
