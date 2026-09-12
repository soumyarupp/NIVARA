"""
generate_template.py
-------------------------------------------------------------------------
Generates a sample standard Excel template for NIVARA monthly flash reporting.
-------------------------------------------------------------------------
"""

import os
import pandas as pd

def generate_sample_excel(output_path: str = "data/raw/projects_template.xlsx"):
    data = [
        {
            "Project ID": "701105",
            "Project Name": "Goa Airport Terminal Building Extension Project",
            "Agency": "Airport Authority of India [AAI]",
            "State": "Goa",
            "Sector": "Civil Aviation",
            "Project Status": "Ongoing",
            "Start Date": "12/2019",
            "Original/Target DoC": "12/2021",
            "Revised DoC": "04/2026",
            "Original Cost (Rs. Crore)": 255.69,
            "Revised Cost (Rs. Crore)": 255.69,
            "Cumulative Expenditure (Rs. Crore)": 161.06,
            "Monthly Expenditure": 3.20,
            "Physical Progress (%)": 63.0,
            "Financial Progress (%)": 63.0,
            "Month & Year": "July 2026",
            "Delay Months": 52,
            "Delay Reason": "Design revision and slow mobilization by contractor",
            "Actual Completion Date": None,
            "Actual Final Expenditure": None
        },
        {
            "Project ID": "701263",
            "Project Name": "Rajasthan Refinery Project",
            "Agency": "HPCL Rajasthan Refinery Limited [HRRL]",
            "State": "Rajasthan",
            "Sector": "Petroleum",
            "Project Status": "Ongoing",
            "Start Date": "01/2018",
            "Original/Target DoC": "10/2022",
            "Revised DoC": "12/2026",
            "Original Cost (Rs. Crore)": 43129.0,
            "Revised Cost (Rs. Crore)": 72937.0,
            "Cumulative Expenditure (Rs. Crore)": 58240.5,
            "Monthly Expenditure": 820.0,
            "Physical Progress (%)": 82.5,
            "Financial Progress (%)": 79.8,
            "Month & Year": "July 2026",
            "Delay Months": 50,
            "Delay Reason": "Delay in equipment delivery from foreign vendors and Covid lockdown",
            "Actual Completion Date": None,
            "Actual Final Expenditure": None
        }
    ]
    df = pd.DataFrame(data)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_excel(output_path, index=False)
    print(f"Sample template generated at: {output_path}")

if __name__ == "__main__":
    generate_sample_excel()
