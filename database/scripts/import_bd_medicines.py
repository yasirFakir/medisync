import urllib.request
import csv
import io
import re
import os
import psycopg2
from psycopg2.extras import execute_values

# Repository raw CSV URLs from ahmedshahriar/bd-medicine-scraper
MEDICINES_URL = "https://raw.githubusercontent.com/ahmedshahriar/bd-medicine-scraper/main/data/medicine.csv"
GENERICS_URL = "https://raw.githubusercontent.com/ahmedshahriar/bd-medicine-scraper/main/data/generic.csv"

def fetch_csv(url):
    print(f"Fetching {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
    return list(csv.DictReader(io.StringIO(content)))

def parse_price(package_size):
    if not package_size:
        return 1.00
    match = re.search(r'(?:৳|Tk\.?|BDT)?\s*([\d\.]+)', package_size, re.IGNORECASE)
    if match:
        try:
            val = float(match.group(1))
            if val > 0:
                return round(val, 2)
        except ValueError:
            pass
    return 1.00

def main():
    db_url = os.getenv("DATABASE_URL", "postgresql://medisync:medisync_pass@localhost:5432/medisync_db")
    print("Connecting to PostgreSQL database...")
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    try:
        medicines = fetch_csv(MEDICINES_URL)
        generics = fetch_csv(GENERICS_URL)

        generic_map = {}
        for g in generics:
            name = (g.get('name') or g.get('generic name') or '').strip().lower()
            if name:
                generic_map[name] = g

        print(f"Fetched {len(medicines)} medicines and {len(generics)} generic records.")

        records = []
        seen = set()

        for m in medicines:
            brand = (m.get('brand name') or m.get('brand_name') or '').strip()
            salt = (m.get('generic') or m.get('generic_name') or '').strip()
            strength = (m.get('strength') or '').strip() or 'N/A'
            dosage_form = (m.get('dosage form') or m.get('dosage_form') or m.get('medicine type') or '').strip() or 'Tablet'
            manufacturer = (m.get('manufacturer') or '').strip() or 'Unknown'
            package_size = m.get('Package Size') or m.get('package_size') or ''
            price = parse_price(package_size)

            if not brand or not salt:
                continue

            dedup_key = (brand.lower(), salt.lower(), strength.lower())
            if dedup_key in seen:
                continue
            seen.add(dedup_key)

            g_info = generic_map.get(salt.lower(), {})
            uses = g_info.get('indication') or g_info.get('generic details') or None
            side_effects = g_info.get('side_effects') or g_info.get('side effect') or None
            contraindications = g_info.get('contraindications') or None
            drug_interactions = g_info.get('drug_interactions') or None

            records.append((
                brand,
                salt,
                strength,
                dosage_form,
                manufacturer,
                uses,
                side_effects,
                contraindications,
                drug_interactions,
                'Store below 30°C in a cool dry place',
                False,
                price,
                False,
                5.00
            ))

        print(f"Prepared {len(records)} unique drug records to insert into master_pharmacy...")

        insert_query = """
        INSERT INTO master_pharmacy (
            brand_name, salt_composition, strength, dosage_form, manufacturer,
            uses, side_effects, contraindications, drug_interactions, storage_instructions,
            prescription_required, estimated_price, is_generic, trust_rating
        ) VALUES %s
        ON CONFLICT DO NOTHING;
        """

        execute_values(cursor, insert_query, records, page_size=1000)
        conn.commit()

        cursor.execute("SELECT COUNT(*) FROM master_pharmacy;")
        total_count = cursor.fetchone()[0]
        print(f"Successfully populated master_pharmacy. Total records: {total_count}")

    except Exception as e:
        conn.rollback()
        print(f"Error during import: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
