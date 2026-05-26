# Field and Lab Workflow Methodology
*The golden rule of field ecology: Do the absolute minimum while exposed to the elements. Collect, stabilize, label, and bring it back to the lab.*

---

## Part 1: The Bag Nomenclature (Labeling System)
A missing or smeared label ruins a sample. All bags and vials must be labeled using Sharpie (which is alcohol and water-resistant) with the following nomenclature:

**Format:** `[DATE]-[SITE]-[TREATMENT]-[PLANT]-[SAMPLE]`

**Code Breakdown:**
*   **DATE:** MMDD format (e.g., `0520` for May 20th).
*   **SITE:** The site number from your pre-planned sheet (e.g., `S01`).
*   **TREATMENT:** `D` for Disturbed (urban/roadside) or `U` for Undisturbed (wild pasture).
*   **PLANT:** The plant number at that site (e.g., `P01` through `P10`). Leave as `COMP` for composite soil samples.
*   **SAMPLE TYPE:** `LEAF`, `ROOT`, `BUG`, `SOIL`.

**Examples:**
*   `0520-S01-D-P03-BUG`: May 20, Site 1, Disturbed, Plant 3, Insect Vial.
*   `0520-S01-D-COMP-SOIL`: May 20, Site 1, Disturbed, Composite Soil Sample (Pooled from all 10 plants).

---

## Part 2: In-Field Workflow (Fast & Dirty)
*Time per site: ~30-45 minutes total for 10 plants.*

1. **Digital Check-In (2 mins):** Pull over safely. Open the Data Collection App on your phone. Hit "Get Location" to lock in GPS. Fill out the site-level data (Temperature, Drought Stress).
2. **Plant Selection & Photography (10 mins):** Identify 10 plants, spaced at least 5 meters apart. Place a physical ruler or scale bar next to Plant 1. Take a wide shot of the habitat, a full shot of the plant, and a macro shot of any obvious damage or insects.

### 2. Genetic Leaf Sampling & Dry Ice Logistics (NEW)
**Objective**: Preserve SLNS leaf tissue for transcriptomic analysis (gene expression) without RNA degradation.
1. **Clipping**: Remove 3-4 young, fully expanded leaves per plant using sterilized scissors (to prevent cross-contamination).
2. **Flash Freezing**: Immediately place leaves into a pre-labeled sterile tube or Whirl-Pak bag and drop directly into the **Dry Ice Cooler** within 60 seconds of clipping.
3. **Chain of Custody**: Log the `Genetic_Sample_ID` in the Data Collection App, ensuring the "Sample Stored in Dry Ice" checkbox is ticked.
4. **Daily FedEx Dispatch**: At the end of every collection day (or every 48 hours maximum), pack the frozen samples into a styrofoam shipping box with fresh dry ice.
5. **Shipping**: Ship via FedEx Priority Overnight to Kariyat Lab. Log the tracking number in the Data Collection App.

### 3. Data Syncing (Every Evening):
3. **Above-Ground Harvesting (10 mins):** 
    *   Clip the plant at the soil line. 
    *   Drop the entire above-ground plant into a **Paper Bag** (Paper breathes and prevents mold; plastic bags will turn the plant into mush in the Texas heat). Label it: `[Nomenclature]-LEAF`.
    *   *If collecting live bugs:* Shake the plant over a sweep net or directly pluck beetles into a plastic vial with a piece of paper towel. Label: `[Nomenclature]-BUG`.
4. **Below-Ground Harvesting (15 mins):**
    *   Dig up the root crown/rhizome structure. Shake off excess dirt. Place in a paper bag. Label: `[Nomenclature]-ROOT`.
    *   Take a small trowel of soil (approx. 1/2 cup) from the root zone of that plant. Drop it into a gallon-sized **Ziploc Bag** dedicated to that site. This is your Composite Soil bag.
5. **Stabilize (Ongoing):** Place all bug vials and soil Ziplocs into a cooler with ice packs immediately to preserve nematode/microbial life.

---

## Part 3: In-Lab Workflow (AC Processing)
*Offsetting the heavy lifting to the lab.*

1. **Insect Processing:**
    *   Place bug vials in the freezer for 24 hours to euthanize safely.
    *   Under a dissecting microscope, count adults, larvae, and egg clusters per plant. 
    *   Log these counts into the master database.
2. **Plant Biomass Processing:**
    *   Place paper plant bags into a drying oven (usually 60°C for 48-72 hours) until crisp.
    *   Weigh the dried above-ground plant (Biomass in grams).
    *   Count the internode spines on a standard 10cm section of stem.
    *   Log Biomass and Spine Density into the master database.
3. **Soil Processing (Send-Off):**
    *   Take the gallon Ziploc (Composite Soil) from the cooler. Mix it thoroughly so it represents the "average" soil of the site.
    *   Scoop out the required amount (usually 1-2 cups) into the official shipping boxes provided by your agronomy testing lab (e.g., Texas A&M AgriLife Extension Soil Lab).
    *   Ship to the lab with the requested test codes (See `soil_health_metrics.md`).
