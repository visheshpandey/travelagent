"""Hand-curated POI data for TravelPilot mock destinations.

Each destination maps to a list of POIs matching the schema from the build doc
(section 4): id, name, lat, lng, category, open_hours, avg_duration_min, cost,
closed_on. One POI per destination is pre-flagged with closed_on so the
scripted demo disruption is always reliable.
"""

POIS = {
    "Jaipur": [
        {"id": "jp_01", "name": "Amber Fort", "lat": 26.9855, "lng": 75.8513, "category": "heritage", "open_hours": "08:00-17:30", "avg_duration_min": 120, "cost": 500, "closed_on": "2026-11-10"},
        {"id": "jp_02", "name": "City Palace", "lat": 26.9258, "lng": 75.8237, "category": "heritage", "open_hours": "09:30-17:00", "avg_duration_min": 90, "cost": 300, "closed_on": None},
        {"id": "jp_03", "name": "Hawa Mahal", "lat": 26.9239, "lng": 75.8267, "category": "heritage", "open_hours": "09:00-16:30", "avg_duration_min": 45, "cost": 200, "closed_on": None},
        {"id": "jp_04", "name": "Jantar Mantar", "lat": 26.9246, "lng": 75.8244, "category": "heritage", "open_hours": "09:00-16:30", "avg_duration_min": 60, "cost": 200, "closed_on": None},
        {"id": "jp_05", "name": "Local Thali Restaurant", "lat": 26.9200, "lng": 75.8100, "category": "food", "open_hours": "11:00-22:00", "avg_duration_min": 60, "cost": 300, "closed_on": None},
        {"id": "jp_06", "name": "Laxmi Mishthan Bhandar", "lat": 26.9157, "lng": 75.8236, "category": "food", "open_hours": "08:00-22:30", "avg_duration_min": 45, "cost": 250, "closed_on": None},
        {"id": "jp_07", "name": "Bar Palladio", "lat": 26.9089, "lng": 75.8072, "category": "nightlife", "open_hours": "19:00-00:30", "avg_duration_min": 90, "cost": 1200, "closed_on": None},
        {"id": "jp_08", "name": "Johari Bazaar", "lat": 26.9214, "lng": 75.8259, "category": "shopping", "open_hours": "10:00-21:00", "avg_duration_min": 90, "cost": 800, "closed_on": None},
        {"id": "jp_09", "name": "Bapu Bazaar", "lat": 26.9174, "lng": 75.8228, "category": "shopping", "open_hours": "10:00-21:00", "avg_duration_min": 90, "cost": 700, "closed_on": None},
        {"id": "jp_10", "name": "Nahargarh Fort", "lat": 26.9373, "lng": 75.8154, "category": "nature", "open_hours": "10:00-17:30", "avg_duration_min": 90, "cost": 200, "closed_on": None},
        {"id": "jp_11", "name": "Central Park", "lat": 26.8987, "lng": 75.8062, "category": "nature", "open_hours": "05:00-20:00", "avg_duration_min": 60, "cost": 0, "closed_on": None},
        {"id": "jp_12", "name": "Chokhi Dhani", "lat": 26.7825, "lng": 75.7591, "category": "nightlife", "open_hours": "17:00-23:00", "avg_duration_min": 150, "cost": 1000, "closed_on": None},
        {"id": "jp_13", "name": "Albert Hall Museum", "lat": 26.9114, "lng": 75.8195, "category": "heritage", "open_hours": "09:00-17:00", "avg_duration_min": 75, "cost": 150, "closed_on": None},
    ],
    "Delhi": [
        {"id": "dl_01", "name": "Red Fort", "lat": 28.6562, "lng": 77.2410, "category": "heritage", "open_hours": "09:30-16:30", "avg_duration_min": 120, "cost": 550, "closed_on": "2026-11-10"},
        {"id": "dl_02", "name": "Qutub Minar", "lat": 28.5245, "lng": 77.1855, "category": "heritage", "open_hours": "07:00-17:00", "avg_duration_min": 90, "cost": 600, "closed_on": None},
        {"id": "dl_03", "name": "Humayun's Tomb", "lat": 28.5933, "lng": 77.2507, "category": "heritage", "open_hours": "06:00-18:00", "avg_duration_min": 90, "cost": 600, "closed_on": None},
        {"id": "dl_04", "name": "India Gate", "lat": 28.6129, "lng": 77.2295, "category": "heritage", "open_hours": "00:00-23:59", "avg_duration_min": 45, "cost": 0, "closed_on": None},
        {"id": "dl_05", "name": "Karim's", "lat": 28.6507, "lng": 77.2334, "category": "food", "open_hours": "12:00-23:59", "avg_duration_min": 60, "cost": 400, "closed_on": None},
        {"id": "dl_06", "name": "Chandni Chowk Street Food", "lat": 28.6506, "lng": 77.2303, "category": "food", "open_hours": "10:00-22:00", "avg_duration_min": 90, "cost": 350, "closed_on": None},
        {"id": "dl_07", "name": "Hauz Khas Social", "lat": 28.5535, "lng": 77.1948, "category": "nightlife", "open_hours": "18:00-01:00", "avg_duration_min": 120, "cost": 1500, "closed_on": None},
        {"id": "dl_08", "name": "Khan Market", "lat": 28.5992, "lng": 77.2266, "category": "shopping", "open_hours": "10:00-21:00", "avg_duration_min": 90, "cost": 1000, "closed_on": None},
        {"id": "dl_09", "name": "Dilli Haat", "lat": 28.5732, "lng": 77.2069, "category": "shopping", "open_hours": "10:30-22:00", "avg_duration_min": 90, "cost": 500, "closed_on": None},
        {"id": "dl_10", "name": "Lodhi Garden", "lat": 28.5931, "lng": 77.2197, "category": "nature", "open_hours": "06:00-20:00", "avg_duration_min": 60, "cost": 0, "closed_on": None},
        {"id": "dl_11", "name": "Akshardham Temple", "lat": 28.6127, "lng": 77.2773, "category": "heritage", "open_hours": "09:30-18:30", "avg_duration_min": 150, "cost": 250, "closed_on": None},
        {"id": "dl_12", "name": "Connaught Place Nightlife Strip", "lat": 28.6315, "lng": 77.2167, "category": "nightlife", "open_hours": "17:00-23:30", "avg_duration_min": 90, "cost": 900, "closed_on": None},
    ],
    "Agra": [
        {"id": "ag_01", "name": "Taj Mahal", "lat": 27.1751, "lng": 78.0421, "category": "heritage", "open_hours": "06:00-18:30", "avg_duration_min": 150, "cost": 1100, "closed_on": "2026-11-10"},
        {"id": "ag_02", "name": "Agra Fort", "lat": 27.1795, "lng": 78.0211, "category": "heritage", "open_hours": "06:00-18:00", "avg_duration_min": 90, "cost": 550, "closed_on": None},
        {"id": "ag_03", "name": "Fatehpur Sikri", "lat": 27.0937, "lng": 77.6613, "category": "heritage", "open_hours": "06:00-18:00", "avg_duration_min": 120, "cost": 550, "closed_on": None},
        {"id": "ag_04", "name": "Mehtab Bagh", "lat": 27.1836, "lng": 78.0424, "category": "nature", "open_hours": "06:00-19:00", "avg_duration_min": 60, "cost": 300, "closed_on": None},
        {"id": "ag_05", "name": "Pinch of Spice", "lat": 27.1592, "lng": 78.0090, "category": "food", "open_hours": "11:00-23:00", "avg_duration_min": 60, "cost": 500, "closed_on": None},
        {"id": "ag_06", "name": "Petha Shops, Sadar Bazaar", "lat": 27.1650, "lng": 78.0080, "category": "food", "open_hours": "10:00-21:00", "avg_duration_min": 45, "cost": 200, "closed_on": None},
        {"id": "ag_07", "name": "Sadar Bazaar Shopping", "lat": 27.1665, "lng": 78.0085, "category": "shopping", "open_hours": "10:00-21:00", "avg_duration_min": 90, "cost": 600, "closed_on": None},
        {"id": "ag_08", "name": "Kalakriti Cultural Centre", "lat": 27.1611, "lng": 78.0398, "category": "nightlife", "open_hours": "18:30-20:30", "avg_duration_min": 90, "cost": 800, "closed_on": None},
        {"id": "ag_09", "name": "Itmad-ud-Daulah's Tomb", "lat": 27.2020, "lng": 78.0293, "category": "heritage", "open_hours": "06:00-18:00", "avg_duration_min": 60, "cost": 300, "closed_on": None},
    ],
    "Goa": [
        {"id": "go_01", "name": "Baga Beach", "lat": 15.5553, "lng": 73.7517, "category": "nature", "open_hours": "00:00-23:59", "avg_duration_min": 120, "cost": 0, "closed_on": None},
        {"id": "go_02", "name": "Basilica of Bom Jesus", "lat": 15.5009, "lng": 73.9114, "category": "heritage", "open_hours": "09:00-18:00", "avg_duration_min": 60, "cost": 0, "closed_on": "2026-11-10"},
        {"id": "go_03", "name": "Fort Aguada", "lat": 15.4925, "lng": 73.7738, "category": "heritage", "open_hours": "09:30-18:00", "avg_duration_min": 75, "cost": 100, "closed_on": None},
        {"id": "go_04", "name": "Fish Curry Rice Shack", "lat": 15.5560, "lng": 73.7530, "category": "food", "open_hours": "11:00-23:00", "avg_duration_min": 60, "cost": 450, "closed_on": None},
        {"id": "go_05", "name": "Gunpowder Restaurant", "lat": 15.5709, "lng": 73.7460, "category": "food", "open_hours": "12:00-22:30", "avg_duration_min": 60, "cost": 600, "closed_on": None},
        {"id": "go_06", "name": "Tito's Lane", "lat": 15.5559, "lng": 73.7522, "category": "nightlife", "open_hours": "20:00-03:00", "avg_duration_min": 150, "cost": 1800, "closed_on": None},
        {"id": "go_07", "name": "Curlies Beach Shack", "lat": 15.5820, "lng": 73.7420, "category": "nightlife", "open_hours": "10:00-01:00", "avg_duration_min": 120, "cost": 1200, "closed_on": None},
        {"id": "go_08", "name": "Anjuna Flea Market", "lat": 15.5738, "lng": 73.7405, "category": "shopping", "open_hours": "08:00-20:00", "avg_duration_min": 90, "cost": 700, "closed_on": None},
        {"id": "go_09", "name": "Dudhsagar Falls", "lat": 15.3144, "lng": 74.3144, "category": "nature", "open_hours": "08:00-17:00", "avg_duration_min": 180, "cost": 500, "closed_on": None},
        {"id": "go_10", "name": "Chapora Fort", "lat": 15.6062, "lng": 73.7358, "category": "nature", "open_hours": "07:00-18:00", "avg_duration_min": 60, "cost": 0, "closed_on": None},
    ],
    "Udaipur": [
        {"id": "ud_01", "name": "City Palace Udaipur", "lat": 24.5764, "lng": 73.6835, "category": "heritage", "open_hours": "09:30-17:30", "avg_duration_min": 120, "cost": 300, "closed_on": "2026-11-10"},
        {"id": "ud_02", "name": "Lake Pichola Boat Ride", "lat": 24.5736, "lng": 73.6786, "category": "nature", "open_hours": "10:00-18:00", "avg_duration_min": 60, "cost": 700, "closed_on": None},
        {"id": "ud_03", "name": "Jagdish Temple", "lat": 24.5789, "lng": 73.6842, "category": "heritage", "open_hours": "05:00-21:00", "avg_duration_min": 45, "cost": 0, "closed_on": None},
        {"id": "ud_04", "name": "Saheliyon Ki Bari", "lat": 24.5918, "lng": 73.6893, "category": "nature", "open_hours": "09:00-19:00", "avg_duration_min": 60, "cost": 100, "closed_on": None},
        {"id": "ud_05", "name": "Ambrai Restaurant", "lat": 24.5806, "lng": 73.6802, "category": "food", "open_hours": "12:30-22:30", "avg_duration_min": 75, "cost": 800, "closed_on": None},
        {"id": "ud_06", "name": "Millets of Mewar", "lat": 24.5779, "lng": 73.6831, "category": "food", "open_hours": "08:00-22:00", "avg_duration_min": 60, "cost": 350, "closed_on": None},
        {"id": "ud_07", "name": "Sunset Terrace Rooftop Bar", "lat": 24.5761, "lng": 73.6798, "category": "nightlife", "open_hours": "17:00-23:30", "avg_duration_min": 90, "cost": 1000, "closed_on": None},
        {"id": "ud_08", "name": "Hathi Pol Market", "lat": 24.5837, "lng": 73.6871, "category": "shopping", "open_hours": "10:00-20:30", "avg_duration_min": 90, "cost": 600, "closed_on": None},
        {"id": "ud_09", "name": "Sajjangarh Monsoon Palace", "lat": 24.6070, "lng": 73.6512, "category": "nature", "open_hours": "09:00-18:00", "avg_duration_min": 75, "cost": 200, "closed_on": None},
    ],
    "Kochi": [
        {"id": "kc_01", "name": "Fort Kochi Beach", "lat": 9.9658, "lng": 76.2422, "category": "nature", "open_hours": "00:00-23:59", "avg_duration_min": 90, "cost": 0, "closed_on": None},
        {"id": "kc_02", "name": "Chinese Fishing Nets", "lat": 9.9666, "lng": 76.2408, "category": "heritage", "open_hours": "06:00-19:00", "avg_duration_min": 45, "cost": 0, "closed_on": "2026-11-10"},
        {"id": "kc_03", "name": "Mattancherry Palace", "lat": 9.9584, "lng": 76.2599, "category": "heritage", "open_hours": "10:00-17:00", "avg_duration_min": 60, "cost": 100, "closed_on": None},
        {"id": "kc_04", "name": "Jew Town Antique Shopping", "lat": 9.9582, "lng": 76.2603, "category": "shopping", "open_hours": "10:00-19:00", "avg_duration_min": 90, "cost": 800, "closed_on": None},
        {"id": "kc_05", "name": "Kayees Rahmathulla Hotel", "lat": 9.9670, "lng": 76.2437, "category": "food", "open_hours": "12:00-16:00", "avg_duration_min": 60, "cost": 300, "closed_on": None},
        {"id": "kc_06", "name": "Dal Roti Restaurant", "lat": 9.9634, "lng": 76.2453, "category": "food", "open_hours": "12:00-22:30", "avg_duration_min": 60, "cost": 400, "closed_on": None},
        {"id": "kc_07", "name": "Kerala Kathakali Centre", "lat": 9.9599, "lng": 76.2585, "category": "nightlife", "open_hours": "18:00-20:00", "avg_duration_min": 120, "cost": 500, "closed_on": None},
        {"id": "kc_08", "name": "Marine Drive Walkway", "lat": 9.9756, "lng": 76.2789, "category": "nature", "open_hours": "05:00-22:00", "avg_duration_min": 60, "cost": 0, "closed_on": None},
        {"id": "kc_09", "name": "Santa Cruz Basilica", "lat": 9.9639, "lng": 76.2422, "category": "heritage", "open_hours": "09:00-17:30", "avg_duration_min": 45, "cost": 0, "closed_on": None},
    ],
}


def get_pois(destination: str) -> list[dict]:
    """Returns the POI list for a destination, or [] if not curated."""
    return POIS.get(destination, [])


def get_poi_by_id(destination: str, poi_id: str) -> dict | None:
    for poi in get_pois(destination):
        if poi["id"] == poi_id:
            return poi
    return None


def list_destinations() -> list[str]:
    return list(POIS.keys())
