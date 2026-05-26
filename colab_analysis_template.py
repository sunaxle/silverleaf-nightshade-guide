# Silverleaf Nightshade Data Analysis - Colab Template
# Copy and paste this code into a new Google Colab notebook cell

# 1. Install and Import Required Libraries
!pip install --upgrade gspread pandas matplotlib seaborn folium

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import folium
from google.colab import auth
import gspread
from google.auth import default

# 2. Authenticate with Google
# This will prompt you to log into the Google Account that owns the Google Sheet.
auth.authenticate_user()
creds, _ = default()
gc = gspread.authorize(creds)

# 3. Load Data from Google Sheets
# IMPORTANT: Replace 'Silverleaf Nightshade Data' with the actual name of your spreadsheet.
spreadsheet_name = 'Silverleaf Nightshade Data'
worksheet_name = 'Data'

try:
    worksheet = gc.open(spreadsheet_name).worksheet(worksheet_name)
    rows = worksheet.get_all_values()
    # Convert to Pandas DataFrame
    df = pd.DataFrame.from_records(rows[1:], columns=rows[0])
    print("Data loaded successfully!")
    display(df.head())
except Exception as e:
    print(f"Error loading data: {e}")

# --- DATA CLEANING ---
# Convert date column to datetime objects
if 'Date' in df.columns:
    df['Date'] = pd.to_datetime(df['Date'])

# Convert Count and Fecundity to numeric, forcing errors to NaN
if 'Count' in df.columns:
    df['Count'] = pd.to_numeric(df['Count'], errors='coerce')
if 'Fecundity' in df.columns:
    df['Fecundity'] = pd.to_numeric(df['Fecundity'], errors='coerce')

# Split Coordinates into Latitude and Longitude
if 'Coordinates' in df.columns:
    df[['Latitude', 'Longitude']] = df['Coordinates'].str.split(',', expand=True)
    df['Latitude'] = pd.to_numeric(df['Latitude'], errors='coerce')
    df['Longitude'] = pd.to_numeric(df['Longitude'], errors='coerce')

# --- ANALYSIS & VISUALIZATION ---

# Visualization 1: Insect Counts by Phenological Stage
if 'Plant Stage' in df.columns and 'Count' in df.columns:
    plt.figure(figsize=(10, 6))
    sns.barplot(data=df, x='Plant Stage', y='Count', hue='Insect', errorbar=None)
    plt.title('Insect Counts by Plant Phenological Stage')
    plt.ylabel('Average Count')
    plt.xlabel('Plant Stage')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

# Visualization 2: Fecundity Comparison
if 'Fecundity' in df.columns and 'Insect' in df.columns:
    plt.figure(figsize=(10, 6))
    sns.boxplot(data=df, x='Insect', y='Fecundity')
    plt.title('Fecundity Estimates by Insect Species')
    plt.ylabel('Eggs / Larvae Count')
    plt.xlabel('Insect Species')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

# Visualization 3: Spatial Map of Sightings
# Filter out rows missing coordinates
df_map = df.dropna(subset=['Latitude', 'Longitude'])

if not df_map.empty:
    # Center map on the average coordinates (Hidalgo County approximate)
    m = folium.Map(location=[df_map['Latitude'].mean(), df_map['Longitude'].mean()], zoom_start=11)
    
    for idx, row in df_map.iterrows():
        popup_text = f"Site: {row.get('Site', 'N/A')}<br>Insect: {row.get('Insect', 'N/A')}<br>Count: {row.get('Count', 0)}"
        folium.CircleMarker(
            location=[row['Latitude'], row['Longitude']],
            radius=5,
            popup=popup_text,
            color='red' if row.get('Count', 0) > 10 else 'blue',
            fill=True,
            fill_color='red' if row.get('Count', 0) > 10 else 'blue'
        ).add_to(m)
    
    print("Map generated:")
    display(m)
else:
    print("Not enough coordinate data to generate map.")
