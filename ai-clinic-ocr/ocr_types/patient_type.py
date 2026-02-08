from __future__ import annotations
from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, Field

PatientStatus = Literal["Active", "Complicated", "Deceased", "Other"]


class Patient(BaseModel):
    name: str = Field(description="Full name of the patient")
    name_ar: Optional[str] = Field(default=None, description="Arabic name if present")
    age: Optional[int] = Field(default=None, description="Patient age in years")
    gender: Optional[str] = Field(
        default=None, description="Gender (e.g., 'Male', 'Female')"
    )
    dob: Optional[date] = Field(default=None, description="Date of birth")
    phone: Optional[str] = Field(default=None, description="Primary contact number")
    optional_phone: Optional[str] = Field(
        default=None, description="Secondary contact number"
    )

    # Clinical Baselines
    height: Optional[int] = Field(default=None, description="Height in cm")
    initial_weight: Optional[float] = Field(
        default=None, description="Initial recorded weight in kg"
    )
    initial_bmi: Optional[float] = Field(default=None, description="Initial BMI value")

    # Demographics
    clinic_address: Optional[str] = Field(
        default=None, description="Address or location of the clinic"
    )
    residency: Optional[str] = Field(
        default=None, description="Patient's place of residence"
    )
    referral: Optional[str] = Field(
        default=None, description="Referral source (Doctor name or campaign)"
    )
    call_center_agent: Optional[str] = Field(
        default=None, description="Agent who handled the patient / called them"
    )

    # Metadata
    status: Optional[PatientStatus] = Field(
        default="Complicated",
        description="Patient status: 'Complicated', 'Deceased', or other",
    )
    first_visit_date: Optional[date] = Field(
        default=None, description="Date of the first consultation"
    )
