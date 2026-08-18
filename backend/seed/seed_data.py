import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import json
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash
from app import create_app
from app.models.models import (
    db, User, Warehouse, Zone, Bin, Supplier, Product,
    Inventory, Order, OrderItem, Allocation, PickingTask,
    PackingTask, QualityCheck, ExceptionRecord, Notification,
    DecisionLog, ReplenishmentRecommendation, BottleneckMetric, AuditLog
)

def seed_with_context():
    """
    Seeds the database using the CURRENT app context.
    Call this when already inside an app.app_context().
    Does NOT call db.drop_all() — safe to use for first-time auto-seeding.
    """
    now = datetime.now(timezone.utc)

    # 1. Seed Users (All 5 Roles)
    print("Seeding Users...")
    users = [
        User(
            username='admin',
            email='admin@smartfulfill.ai',
            password_hash=generate_password_hash('admin123'),
            role='admin',
            full_name='Sarah Jenkins',
            department='Executive Operations',
            avatar_url='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
        ),
        User(
            username='manager',
            email='manager@smartfulfill.ai',
            password_hash=generate_password_hash('manager123'),
            role='manager',
            full_name='Marcus Vance',
            department='Fulfillment Operations',
            avatar_url='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
        ),
        User(
            username='picker',
            email='picker@smartfulfill.ai',
            password_hash=generate_password_hash('picker123'),
            role='picker',
            full_name='David Chen',
            department='Zone A Picking Squad',
            avatar_url='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        ),
        User(
            username='packer',
            email='packer@smartfulfill.ai',
            password_hash=generate_password_hash('packer123'),
            role='packer',
            full_name='Elena Rostova',
            department='Packing Station 03',
            avatar_url='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        ),
        User(
            username='inventory',
            email='inventory@smartfulfill.ai',
            password_hash=generate_password_hash('inventory123'),
            role='inventory',
            full_name='Robert Sterling',
            department='Inventory Control & Procurement',
            avatar_url='https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
        )
    ]
    db.session.add_all(users)
    db.session.commit()

    # 2. Seed Warehouses
    print("Seeding Warehouses...")
    warehouses = [
        Warehouse(
            code='WH-A',
            name='Central Fulfillment Center 01',
            location='Chicago, IL (Main Distribution Hub)',
            capacity_sqft=125000,
            current_workload_pct=76.5,
            status='ACTIVE'
        ),
        Warehouse(
            code='WH-B',
            name='West Coast Logistics Center 02',
            location='Reno, NV (Pacific Express)',
            capacity_sqft=95000,
            current_workload_pct=58.0,
            status='ACTIVE'
        ),
        Warehouse(
            code='WH-C',
            name='East Coast Gateway 03',
            location='Newark, NJ (Atlantic Regional)',
            capacity_sqft=80000,
            current_workload_pct=64.0,
            status='ACTIVE'
        )
    ]
    db.session.add_all(warehouses)
    db.session.commit()

    wh_a = warehouses[0]
    wh_b = warehouses[1]
    wh_c = warehouses[2]

    # 3. Seed Zones
    print("Seeding Zones...")
    zones = [
        Zone(warehouse_id=wh_a.id, code='Zone A', name='High-Velocity Fast Pick', zone_type='High-Velocity', workload_pct=88.0, picker_count=4),
        Zone(warehouse_id=wh_a.id, code='Zone B', name='Bulk Electronics & Hardware', zone_type='Bulk', workload_pct=58.0, picker_count=3),
        Zone(warehouse_id=wh_a.id, code='Zone C', name='Fragile & Secure Vault', zone_type='Fragile', workload_pct=64.0, picker_count=2),
        Zone(warehouse_id=wh_a.id, code='Zone D', name='Cold Storage & Chemicals', zone_type='Cold', workload_pct=42.0, picker_count=1),
        Zone(warehouse_id=wh_b.id, code='Zone W1', name='West Primary Ingest', zone_type='High-Velocity', workload_pct=52.0, picker_count=3),
        Zone(warehouse_id=wh_b.id, code='Zone W2', name='West Bulk Reserve', zone_type='Bulk', workload_pct=45.0, picker_count=2),
        Zone(warehouse_id=wh_c.id, code='Zone E1', name='East Fast Flow', zone_type='High-Velocity', workload_pct=62.0, picker_count=3)
    ]
    db.session.add_all(zones)
    db.session.commit()

    za, zb, zc, zd = zones[0], zones[1], zones[2], zones[3]

    # 4. Seed Bins with Coordinates for Route Optimizer
    print("Seeding Bins...")
    bins_data = [
        # Zone A Bins
        Bin(zone_id=za.id, code='A01', aisle='A', shelf='01', level='1', x_coord=2.0, y_coord=1.0, capacity_units=600),
        Bin(zone_id=za.id, code='A02', aisle='A', shelf='02', level='1', x_coord=4.0, y_coord=1.0, capacity_units=600),
        Bin(zone_id=za.id, code='A03', aisle='A', shelf='03', level='1', x_coord=6.0, y_coord=1.0, capacity_units=600),
        Bin(zone_id=za.id, code='A04', aisle='A', shelf='04', level='1', x_coord=8.0, y_coord=1.0, capacity_units=600),
        Bin(zone_id=za.id, code='A05', aisle='A', shelf='05', level='2', x_coord=10.0, y_coord=1.0, capacity_units=600),
        # Zone B Bins
        Bin(zone_id=zb.id, code='B01', aisle='B', shelf='01', level='1', x_coord=2.0, y_coord=4.0, capacity_units=800),
        Bin(zone_id=zb.id, code='B02', aisle='B', shelf='02', level='1', x_coord=5.0, y_coord=4.0, capacity_units=800),
        Bin(zone_id=zb.id, code='B03', aisle='B', shelf='03', level='2', x_coord=8.0, y_coord=4.0, capacity_units=800),
        Bin(zone_id=zb.id, code='B04', aisle='B', shelf='04', level='2', x_coord=11.0, y_coord=4.0, capacity_units=800),
        # Zone C Bins
        Bin(zone_id=zc.id, code='C01', aisle='C', shelf='01', level='1', x_coord=3.0, y_coord=8.0, capacity_units=400),
        Bin(zone_id=zc.id, code='C02', aisle='C', shelf='02', level='1', x_coord=6.0, y_coord=8.0, capacity_units=400),
        Bin(zone_id=zc.id, code='C03', aisle='C', shelf='03', level='2', x_coord=9.0, y_coord=8.0, capacity_units=400),
        # WH-B and WH-C Bins
        Bin(zone_id=zones[4].id, code='W101', aisle='W', shelf='01', level='1', x_coord=2.0, y_coord=2.0, capacity_units=700),
        Bin(zone_id=zones[5].id, code='W201', aisle='W', shelf='02', level='1', x_coord=5.0, y_coord=5.0, capacity_units=900),
        Bin(zone_id=zones[6].id, code='E101', aisle='E', shelf='01', level='1', x_coord=2.0, y_coord=2.0, capacity_units=700)
    ]
    db.session.add_all(bins_data)
    db.session.commit()

    bin_map = {b.code: b for b in bins_data}

    # 5. Seed Suppliers
    print("Seeding Suppliers...")
    suppliers = [
        Supplier(code='SUP-APEX', name='Apex Electronics Global Ltd.', contact_email='orders@apexelectronics.com', phone='+1-800-555-0199', lead_time_days=2, reliability_score=98.5),
        Supplier(code='SUP-NORDIC', name='Nordic Gear & Logistics Corp', contact_email='b2b@nordiclogistics.com', phone='+1-800-555-0144', lead_time_days=3, reliability_score=95.0),
        Supplier(code='SUP-INDUSTRIAL', name='Industrial Pro Tools Inc.', contact_email='sales@industrialpro.com', phone='+1-800-555-0177', lead_time_days=5, reliability_score=91.2),
        Supplier(code='SUP-CYBER', name='CyberCore Semiconductor Group', contact_email='dispatch@cybercore.io', phone='+1-800-555-0122', lead_time_days=4, reliability_score=96.8)
    ]
    db.session.add_all(suppliers)
    db.session.commit()

    sup_apex = suppliers[0]
    sup_nordic = suppliers[1]
    sup_ind = suppliers[2]
    sup_cyber = suppliers[3]

    # 6. Seed 50+ Realistic Products
    print("Seeding 50+ Products...")
    raw_products = [
        # 1. HACKATHON DEMO PRODUCT
        ('SKU-ELEC-101', 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones', 'Electronics', 249.00, 399.99, 0.85, '22x20x7', 15, 30, 100, 25.0, sup_apex.id),
        
        # Electronics & Computing
        ('SKU-ELEC-102', 'Apple MacBook Pro 16" M3 Max (36GB / 1TB)', 'Electronics', 2450.00, 3499.00, 2.15, '36x25x2', 5, 10, 25, 4.2, sup_apex.id),
        ('SKU-ELEC-103', 'Logitech MX Master 3S Wireless Performance Mouse', 'Electronics', 62.00, 99.99, 0.35, '14x10x6', 20, 40, 150, 18.0, sup_apex.id),
        ('SKU-ELEC-104', 'Samsung 32" Odyssey OLED G8 4K Curved Monitor', 'Electronics', 680.00, 1199.99, 8.40, '72x48x18', 8, 15, 40, 6.5, sup_apex.id),
        ('SKU-ELEC-105', 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard', 'Electronics', 115.00, 199.00, 1.70, '33x15x4', 12, 25, 80, 8.0, sup_apex.id),
        ('SKU-ELEC-106', 'Anker 737 Power Bank (PowerCore 24K, 140W)', 'Electronics', 85.00, 149.99, 0.63, '16x6x6', 25, 50, 180, 22.0, sup_apex.id),
        ('SKU-ELEC-107', 'SanDisk Extreme PRO 2TB Portable SSD (2000MB/s)', 'Electronics', 120.00, 219.99, 0.12, '10x5x1', 30, 60, 200, 28.0, sup_cyber.id),
        ('SKU-ELEC-108', 'Sony Alpha A7 IV Full-Frame Mirrorless Camera', 'Electronics', 1650.00, 2498.00, 1.40, '14x10x8', 6, 12, 30, 3.8, sup_apex.id),
        ('SKU-ELEC-109', 'DJI Mini 4 Pro Drone with RC 2 Controller', 'Electronics', 520.00, 759.00, 0.45, '20x15x10', 8, 18, 50, 7.2, sup_apex.id),
        ('SKU-ELEC-110', 'Bose QuietComfort Ultra Earbuds (Spatial Audio)', 'Electronics', 180.00, 299.00, 0.25, '10x8x4', 15, 35, 120, 14.5, sup_apex.id),
        ('SKU-ELEC-111', 'Elgato Stream Deck XL (32 Customizable Keys)', 'Electronics', 145.00, 249.99, 0.90, '19x12x4', 10, 20, 60, 6.0, sup_cyber.id),
        ('SKU-ELEC-112', 'NVIDIA GeForce RTX 4080 Super 16GB GPU', 'Electronics', 820.00, 1199.00, 2.30, '31x14x6', 4, 10, 30, 5.0, sup_cyber.id),
        ('SKU-ELEC-113', 'Sonos Move 2 Portable Smart Speaker (Battery)', 'Electronics', 280.00, 449.00, 3.00, '24x16x13', 8, 16, 50, 5.5, sup_apex.id),
        ('SKU-ELEC-114', 'Kindle Scribe 10.2" Digital Notebook (64GB)', 'Electronics', 230.00, 389.99, 0.55, '23x20x1', 12, 24, 75, 9.0, sup_apex.id),
        ('SKU-ELEC-115', 'Ubiquiti UniFi Dream Machine Special Edition', 'Electronics', 340.00, 499.00, 5.20, '45x30x6', 5, 12, 35, 4.0, sup_cyber.id),

        # Industrial Tools & Equipment
        ('SKU-IND-201', 'DeWalt 20V MAX XR Cordless Drill Combo Kit', 'Industrial', 135.00, 229.00, 4.80, '40x25x15', 15, 30, 90, 12.0, sup_ind.id),
        ('SKU-IND-202', 'Milwaukee M18 Fuel 1/2" High Torque Impact Wrench', 'Industrial', 190.00, 299.00, 3.60, '25x15x10', 10, 22, 60, 8.5, sup_ind.id),
        ('SKU-IND-203', 'Bosch GLM 50 C Bluetooth Laser Distance Measure', 'Industrial', 78.00, 149.00, 0.30, '12x5x4', 20, 40, 100, 11.0, sup_ind.id),
        ('SKU-IND-204', 'FLIR C5 Compact Thermal Imaging Camera (WiFi)', 'Industrial', 450.00, 699.00, 0.40, '14x8x3', 4, 8, 20, 2.5, sup_ind.id),
        ('SKU-IND-205', 'Klein Tools MM700 Auto-Ranging Digital Multimeter', 'Industrial', 48.00, 89.95, 0.50, '18x9x5', 25, 50, 140, 16.0, sup_ind.id),
        ('SKU-IND-206', 'Knipex Cobra Water Pump Pliers Set (3-Piece)', 'Industrial', 65.00, 115.00, 1.20, '30x10x4', 18, 35, 110, 14.0, sup_ind.id),
        ('SKU-IND-207', 'Wera Kraftform Kompakt 27 RA 1 SB Ratcheting Set', 'Industrial', 32.00, 58.00, 0.45, '20x8x4', 30, 60, 160, 20.0, sup_ind.id),
        ('SKU-IND-208', 'Festool 576032 Cordless Track Saw TSC 55 KEB-F-Basic', 'Industrial', 420.00, 675.00, 6.20, '45x35x30', 3, 6, 15, 1.8, sup_ind.id),
        ('SKU-IND-209', 'Makita 18V LXT Lithium-Ion Brushless Angle Grinder', 'Industrial', 88.00, 149.00, 2.50, '38x15x12', 12, 25, 70, 7.5, sup_ind.id),
        ('SKU-IND-210', 'Lincoln Electric Handy MIG Welder (115V)', 'Industrial', 240.00, 399.00, 21.00, '48x38x30', 2, 5, 12, 1.2, sup_ind.id),

        # Outdoor & Tactical Gear
        ('SKU-GEAR-301', 'Osprey Atmos AG 65 Men Backpack (L/XL)', 'Apparel & Gear', 180.00, 340.00, 2.20, '85x38x35', 8, 16, 45, 5.0, sup_nordic.id),
        ('SKU-GEAR-302', 'Garmin Fenix 7X Pro Sapphire Solar Edition', 'Apparel & Gear', 580.00, 899.99, 0.35, '12x12x8', 6, 14, 40, 6.0, sup_nordic.id),
        ('SKU-GEAR-303', 'Yeti Tundra 45 Hard Cooler (Desert Tan)', 'Apparel & Gear', 195.00, 325.00, 10.40, '65x41x39', 5, 12, 35, 4.5, sup_nordic.id),
        ('SKU-GEAR-304', 'Big Agnes Copper Spur HV UL2 Ultralight Tent', 'Apparel & Gear', 280.00, 499.95, 1.45, '45x15x15', 6, 12, 30, 3.2, sup_nordic.id),
        ('SKU-GEAR-305', 'Therm-a-Rest NeoAir XTherm NXT Sleeping Pad', 'Apparel & Gear', 130.00, 239.95, 0.48, '24x12x12', 10, 20, 60, 6.8, sup_nordic.id),
        ('SKU-GEAR-306', 'Jetboil Flash Camping and Backpacking Stove Cooking', 'Apparel & Gear', 68.00, 124.95, 0.40, '18x12x12', 15, 30, 90, 10.5, sup_nordic.id),
        ('SKU-GEAR-307', 'Black Diamond Spot 400-R Rechargeable Headlamp', 'Apparel & Gear', 28.00, 54.95, 0.15, '10x6x4', 35, 70, 220, 26.0, sup_nordic.id),
        ('SKU-GEAR-308', 'Arc\'teryx Beta AR Waterproof Jacket (Men\'s Large)', 'Apparel & Gear', 360.00, 600.00, 0.50, '35x25x5', 6, 12, 35, 4.0, sup_nordic.id),
        ('SKU-GEAR-309', 'Leki Makalu FX Carbon Folding Trekking Poles', 'Apparel & Gear', 115.00, 219.95, 0.52, '42x10x6', 10, 22, 65, 7.0, sup_nordic.id),
        ('SKU-GEAR-310', 'Katadyn BeFree 1.0L Water Filtration System', 'Apparel & Gear', 24.00, 44.95, 0.08, '15x8x6', 40, 80, 250, 30.0, sup_nordic.id),

        # Home, Smart Living & Wellness
        ('SKU-HOME-401', 'Dyson V15 Detect Cordless Vacuum Cleaner', 'Home & Living', 440.00, 749.99, 3.10, '90x30x20', 8, 18, 50, 8.5, sup_apex.id),
        ('SKU-HOME-402', 'Breville Barista Touch Espresso Machine (Stainless)', 'Home & Living', 580.00, 999.95, 12.00, '42x38x35', 4, 10, 30, 3.5, sup_apex.id),
        ('SKU-HOME-403', 'Philips Hue White & Color Ambiance Starter Kit', 'Home & Living', 95.00, 179.99, 0.85, '22x18x10', 20, 40, 120, 15.0, sup_cyber.id),
        ('SKU-HOME-404', 'Ember Temperature Control Smart Mug 2 (14 oz)', 'Home & Living', 75.00, 149.95, 0.45, '15x12x12', 15, 30, 90, 11.0, sup_apex.id),
        ('SKU-HOME-405', 'Roborock S8 Pro Ultra Robot Vacuum and Mop', 'Home & Living', 890.00, 1599.99, 14.50, '55x48x45', 3, 8, 25, 2.8, sup_apex.id),
        ('SKU-HOME-406', 'Ninja Foodi Smart XL 6-in-1 Indoor Grill (Air Fry)', 'Home & Living', 140.00, 259.99, 9.20, '45x40x30', 10, 20, 60, 7.2, sup_apex.id),
        ('SKU-HOME-407', 'Theragun PRO Plus Percussive Therapy Device', 'Home & Living', 340.00, 599.00, 1.65, '28x22x10', 6, 15, 40, 4.8, sup_apex.id),
        ('SKU-HOME-408', 'Oura Ring Gen3 Horizon Titanium Smart Ring (Size 10)', 'Home & Living', 210.00, 349.00, 0.05, '10x10x5', 12, 25, 75, 9.5, sup_cyber.id),
        ('SKU-HOME-409', 'Fellow Stagg EKG Electric Gooseneck Pour-Over Kettle', 'Home & Living', 95.00, 165.00, 1.25, '30x20x20', 14, 28, 85, 10.0, sup_apex.id),
        ('SKU-HOME-410', 'Bissell Little Green Multi-Purpose Portable Carpet', 'Home & Living', 68.00, 123.59, 4.35, '38x30x25', 18, 36, 110, 13.5, sup_apex.id),

        # Office & Ergonomics
        ('SKU-OFF-501', 'Herman Miller Aeron Chair (Size B, Fully Loaded)', 'Office', 850.00, 1695.00, 21.50, '70x70x105', 3, 6, 18, 2.0, sup_ind.id),
        ('SKU-OFF-502', 'Uplift V2 Commercial Standing Desk Frame (White)', 'Office', 320.00, 599.00, 32.00, '120x30x20', 4, 8, 20, 2.5, sup_ind.id),
        ('SKU-OFF-503', 'BenQ ScreenBar Halo LED Monitor Light Bar', 'Office', 95.00, 179.00, 0.80, '50x12x8', 15, 30, 90, 12.0, sup_cyber.id),
        ('SKU-OFF-504', 'Steelcase Gesture Headrest Ergonomic Fabric', 'Office', 120.00, 210.00, 1.50, '35x25x15', 8, 16, 45, 5.0, sup_ind.id),
        ('SKU-OFF-505', 'CalDigit TS4 Thunderbolt 4 Dock (18 Ports)', 'Office', 220.00, 399.95, 1.10, '20x10x5', 10, 20, 60, 7.5, sup_cyber.id)
    ]

    products_list = []
    for p in raw_products:
        prod = Product(
            sku=p[0],
            name=p[1],
            category=p[2],
            barcode=f"8809{p[0].replace('-', '')}9",
            unit_cost=p[3],
            unit_price=p[4],
            weight_kg=p[5],
            dimensions_cm=p[6],
            min_safety_stock=p[7],
            reorder_point=p[8],
            reorder_quantity=p[9],
            avg_daily_demand=p[10],
            default_supplier_id=p[11]
        )
        products_list.append(prod)

    db.session.add_all(products_list)
    db.session.commit()

    prod_map = {p.sku: p for p in products_list}

    # 7. Seed 100+ Inventory Records across Warehouses and Bins
    print("Seeding 100+ Inventory Records...")
    inventory_records = []

    # PRE-CONFIGURE HACKATHON DEMO SCENARIO EXACTLY:
    # SKU-ELEC-101 (Sony Headphones) has EXACTLY 7 available units in Warehouse A (Bin A01)!
    demo_sony = prod_map['SKU-ELEC-101']
    inv_demo = Inventory(
        product_id=demo_sony.id,
        warehouse_id=wh_a.id,
        bin_id=bin_map['A01'].id,
        total_stock=7,
        reserved_stock=0,
        damaged_stock=0,
        missing_stock=0,
        batch_no='BAT-2026-SONY-01',
        last_restocked=now - timedelta(days=2)
    )
    inventory_records.append(inv_demo)

    # Also place 2 units in Warehouse B for multi-warehouse transfer demonstration
    inv_demo_b = Inventory(
        product_id=demo_sony.id,
        warehouse_id=wh_b.id,
        bin_id=bin_map['W101'].id,
        total_stock=4,
        reserved_stock=0,
        damaged_stock=0,
        missing_stock=0,
        batch_no='BAT-2026-SONY-02',
        last_restocked=now - timedelta(days=5)
    )
    inventory_records.append(inv_demo_b)

    # Distribute remaining products across bins
    bin_keys = ['A01', 'A02', 'A03', 'A04', 'A05', 'B01', 'B02', 'B03', 'B04', 'C01', 'C02', 'C03']
    
    for idx, p in enumerate(products_list[1:], start=1):
        assigned_bin = bin_map[bin_keys[idx % len(bin_keys)]]
        
        # Create a realistic stock distribution:
        # - Some low stock
        # - Some healthy
        # - A few with damaged or missing units
        if idx in [4, 11, 18, 27]: # Low stock items
            tot = p.reorder_point - 5
            dam = 0
            mis = 0
        elif idx in [8, 22]: # Damaged items present
            tot = p.reorder_point * 2
            dam = 3
            mis = 0
        elif idx in [14, 31]: # Missing items present
            tot = p.reorder_point * 2
            dam = 0
            mis = 2
        elif idx in [3, 15, 35]: # Stockout / nearly zero
            tot = 2
            dam = 0
            mis = 0
        else: # Healthy standard
            tot = p.reorder_quantity
            dam = 0
            mis = 0

        inv = Inventory(
            product_id=p.id,
            warehouse_id=wh_a.id,
            bin_id=assigned_bin.id,
            total_stock=max(tot, 2),
            reserved_stock=0,
            damaged_stock=dam,
            missing_stock=mis,
            batch_no=f"BAT-2026-{(idx+100):03d}",
            last_restocked=now - timedelta(days=(idx % 14))
        )
        inventory_records.append(inv)

        # Secondary inventory record in Warehouse B or C for top 20 items
        if idx <= 25:
            sec_bin = bin_map['W201'] if idx % 2 == 0 else bin_map['E101']
            sec_wh = wh_b if idx % 2 == 0 else wh_c
            inv_sec = Inventory(
                product_id=p.id,
                warehouse_id=sec_wh.id,
                bin_id=sec_bin.id,
                total_stock=max(10, tot // 2),
                reserved_stock=0,
                damaged_stock=0,
                missing_stock=0,
                batch_no=f"BAT-2026-SEC-{(idx+100):03d}",
                last_restocked=now - timedelta(days=(idx % 20))
            )
            inventory_records.append(inv_sec)

    db.session.add_all(inventory_records)
    db.session.commit()

    # 8. Seed Hackathon Demo Scenario Orders + 50 Orders
    print("Seeding Demo Scenario Orders & Full Pipeline...")
    
    # DEMO ORDER A: 10 units Sony Headphones, Critical Priority, SLA 2 hours
    order_a = Order(
        order_number='ORD-2026-0001',
        customer_name='Apex Global Technologies (VIP Enterprise)',
        customer_tier='VIP',
        priority='CRITICAL',
        sla_deadline=now + timedelta(hours=2),
        status='CREATED',
        total_amount=3999.90,
        warehouse_id=wh_a.id,
        notes='URGENT: Executive conference hardware deployment. Guaranteed same-day fulfillment SLA.'
    )
    db.session.add(order_a)
    db.session.flush()

    item_a = OrderItem(
        order_id=order_a.id,
        product_id=demo_sony.id,
        quantity_requested=10,
        quantity_allocated=0,
        status='PENDING'
    )
    db.session.add(item_a)

    # DEMO ORDER B: 5 units Sony Headphones, Normal Priority, SLA 12 hours
    order_b = Order(
        order_number='ORD-2026-0002',
        customer_name='Horizon Retail Direct',
        customer_tier='STANDARD',
        priority='NORMAL',
        sla_deadline=now + timedelta(hours=12),
        status='CREATED',
        total_amount=1999.95,
        warehouse_id=wh_a.id,
        notes='Standard branch stock replenishment order.'
    )
    db.session.add(order_b)
    db.session.flush()

    item_b = OrderItem(
        order_id=order_b.id,
        product_id=demo_sony.id,
        quantity_requested=5,
        quantity_allocated=0,
        status='PENDING'
    )
    db.session.add(item_b)

    # ORDER 3: SLA Risk Order in Zone A
    order_c = Order(
        order_number='ORD-2026-0003',
        customer_name='Nexus Data Systems',
        customer_tier='ENTERPRISE',
        priority='URGENT',
        sla_deadline=now + timedelta(hours=1, minutes=30),
        status='ALLOCATED',
        total_amount=4698.00,
        warehouse_id=wh_a.id,
        notes='SLA Deadline imminent. Priority routing required.'
    )
    db.session.add(order_c)
    db.session.flush()

    item_c1 = OrderItem(order_id=order_c.id, product_id=prod_map['SKU-ELEC-103'].id, quantity_requested=4, quantity_allocated=4, status='ALLOCATED')
    item_c2 = OrderItem(order_id=order_c.id, product_id=prod_map['SKU-ELEC-107'].id, quantity_requested=2, quantity_allocated=2, status='ALLOCATED')
    db.session.add_all([item_c1, item_c2])

    # ORDER 4: Picking In-Progress
    order_d = Order(
        order_number='ORD-2026-0004',
        customer_name='Summit Outdoor Outfitters',
        customer_tier='PREMIUM',
        priority='HIGH',
        sla_deadline=now + timedelta(hours=6),
        status='PICKING',
        total_amount=1450.00,
        warehouse_id=wh_a.id
    )
    db.session.add(order_d)
    db.session.flush()

    item_d1 = OrderItem(order_id=order_d.id, product_id=prod_map['SKU-GEAR-301'].id, quantity_requested=2, quantity_allocated=2, quantity_picked=1, status='ALLOCATED')
    item_d2 = OrderItem(order_id=order_d.id, product_id=prod_map['SKU-GEAR-306'].id, quantity_requested=4, quantity_allocated=4, quantity_picked=4, status='PICKED')
    db.session.add_all([item_d1, item_d2])

    # ORDER 5: Packing Station 03 Bottleneck
    order_e = Order(
        order_number='ORD-2026-0005',
        customer_name='Vanguard Industrial Works',
        customer_tier='ENTERPRISE',
        priority='HIGH',
        sla_deadline=now + timedelta(hours=4),
        status='PACKING',
        total_amount=3280.00,
        warehouse_id=wh_a.id
    )
    db.session.add(order_e)
    db.session.flush()

    item_e = OrderItem(order_id=order_e.id, product_id=prod_map['SKU-IND-201'].id, quantity_requested=6, quantity_allocated=6, quantity_picked=6, quantity_packed=3, status='PICKED')
    db.session.add(item_e)

    # ORDER 6: Quality Check
    order_f = Order(
        order_number='ORD-2026-0006',
        customer_name='Metro Health & Living Corp',
        customer_tier='STANDARD',
        priority='NORMAL',
        sla_deadline=now + timedelta(hours=8),
        status='PACKED',
        total_amount=1580.00,
        warehouse_id=wh_a.id
    )
    db.session.add(order_f)
    db.session.flush()

    item_f = OrderItem(order_id=order_f.id, product_id=prod_map['SKU-HOME-401'].id, quantity_requested=2, quantity_allocated=2, quantity_picked=2, quantity_packed=2, status='PACKED')
    db.session.add(item_f)

    # ORDER 7: Dispatched
    order_g = Order(
        order_number='ORD-2026-0007',
        customer_name='Prime Logistics Solutions',
        customer_tier='PREMIUM',
        priority='NORMAL',
        sla_deadline=now - timedelta(hours=2),
        status='DISPATCHED',
        total_amount=2150.00,
        warehouse_id=wh_a.id,
        dispatched_at=now - timedelta(hours=1)
    )
    db.session.add(order_g)
    db.session.flush()

    item_g = OrderItem(order_id=order_g.id, product_id=prod_map['SKU-OFF-501'].id, quantity_requested=1, quantity_allocated=1, quantity_picked=1, quantity_packed=1, status='PACKED')
    db.session.add(item_g)

    # Seed 45+ additional realistic background orders for charts & analytics
    customer_names = [
        'Global Logistics Inc', 'Aura Smart Living', 'Cyberdyne Systems', 'Pioneer Tooling LLC',
        'Quantum Dynamics', 'Zenith Retail Corp', 'Atlas Distribution', 'Helios Energy Group',
        'Spectra Tech Labs', 'Meridian Supply Co', 'Orion Industrial Gear', 'Velocity Logistics',
        'Apollo Aerospace Direct', 'Titan Equipment Corp', 'Beacon Medical Systems'
    ]
    
    statuses = ['DISPATCHED', 'DISPATCHED', 'DISPATCHED', 'QC_PASSED', 'PACKED', 'PICKED', 'PICKING', 'ALLOCATED', 'CREATED']
    priorities = ['NORMAL', 'NORMAL', 'HIGH', 'NORMAL', 'URGENT', 'LOW']
    tiers = ['STANDARD', 'STANDARD', 'PREMIUM', 'ENTERPRISE', 'VIP']

    for i in range(8, 55):
        c_name = f"{customer_names[i % len(customer_names)]} #{i}"
        c_tier = tiers[i % len(tiers)]
        prio = priorities[i % len(priorities)]
        stat = statuses[i % len(statuses)]
        sla_offset = (i * 2) - 10 # Some past, some imminent, some future
        sla_dt = now + timedelta(hours=sla_offset)
        
        p1 = products_list[(i * 3) % len(products_list)]
        qty1 = (i % 4) + 1
        amt = round(p1.unit_price * qty1, 2)

        ord_bg = Order(
            order_number=f"ORD-2026-{i:04d}",
            customer_name=c_name,
            customer_tier=c_tier,
            priority=prio,
            sla_deadline=sla_dt,
            status=stat,
            total_amount=amt,
            warehouse_id=wh_a.id if i % 4 != 0 else wh_b.id,
            created_at=now - timedelta(hours=i * 1.2),
            dispatched_at=(now - timedelta(hours=i * 0.8)) if stat == 'DISPATCHED' else None
        )
        db.session.add(ord_bg)
        db.session.flush()

        it_bg = OrderItem(
            order_id=ord_bg.id,
            product_id=p1.id,
            quantity_requested=qty1,
            quantity_allocated=qty1 if stat != 'CREATED' else 0,
            quantity_picked=qty1 if stat in ['PICKED', 'PACKING', 'PACKED', 'QC_PASSED', 'DISPATCHED'] else 0,
            quantity_packed=qty1 if stat in ['PACKED', 'QC_PASSED', 'DISPATCHED'] else 0,
            status=stat if stat in ['ALLOCATED', 'PICKED', 'PACKED'] else 'PENDING'
        )
        db.session.add(it_bg)

    db.session.commit()

    # 9. Create Picking Tasks, Packing Tasks, QC Records for seeded active orders
    print("Seeding Tasks & Quality Checks...")
    
    # Picking Task for Order 4
    route_d = [
        {'step_number': 1, 'sku': 'SKU-GEAR-306', 'product_name': 'Jetboil Flash Camping Stove', 'quantity': 4, 'bin_code': 'A01', 'zone_code': 'Zone A', 'x': 2.0, 'y': 1.0, 'status': 'PICKED', 'inventory_id': 1},
        {'step_number': 2, 'sku': 'SKU-GEAR-301', 'product_name': 'Osprey Atmos AG 65 Backpack', 'quantity': 2, 'bin_code': 'A03', 'zone_code': 'Zone A', 'x': 6.0, 'y': 1.0, 'status': 'PENDING', 'inventory_id': 2}
    ]
    pick_task_d = PickingTask(
        order_id=order_d.id,
        assigned_user_id=users[2].id, # picker
        status='IN_PROGRESS',
        total_items=6,
        picked_items=4,
        estimated_distance_m=38.0,
        estimated_time_min=6.5,
        route_sequence_json=json.dumps(route_d),
        started_at=now - timedelta(minutes=12)
    )
    db.session.add(pick_task_d)

    # Packing Task for Order 5
    pack_task_e = PackingTask(
        order_id=order_e.id,
        assigned_user_id=users[3].id, # packer
        status='PACKING',
        recommended_box_type='Box-L (Heavy Reinforced)',
        actual_weight_kg=28.8,
        dimensions_cm='50x40x35',
        packaging_notes='Requires corner foam protectors for industrial power tools.',
        started_at=now - timedelta(minutes=18)
    )
    db.session.add(pack_task_e)

    # QC Check for Order 6
    qc_f = QualityCheck(
        order_id=order_f.id,
        packing_task_id=None,
        inspector_id=users[1].id,
        status='PENDING',
        sku_verified=True,
        quantity_verified=True,
        condition_verified=True,
        packaging_verified=True,
        label_verified=True,
        notes='Awaiting final barcode scanning.'
    )
    db.session.add(qc_f)

    # 10. Seed Exceptions (Demonstrates Exception Center)
    print("Seeding Exception Records...")
    exceptions = [
        ExceptionRecord(
            order_id=order_d.id,
            product_id=prod_map['SKU-GEAR-301'].id,
            exception_type='MISSING_ITEM',
            severity='HIGH',
            impact_summary='Picker David Chen reported 1 missing unit of Osprey Atmos Backpack at Bin A03. Order #ORD-2026-0004 delayed.',
            ai_recommendation='Initiate cycle count on Bin A03; reallocate replacement unit from Reserve Bin W201.',
            resolution_status='OPEN',
            created_at=now - timedelta(minutes=25)
        ),
        ExceptionRecord(
            order_id=order_c.id,
            product_id=prod_map['SKU-ELEC-107'].id,
            exception_type='DAMAGED_ITEM',
            severity='CRITICAL',
            impact_summary='Found 2 units with crushed retail box packaging in Bin A04 during QC inspection.',
            ai_recommendation='Quarantine damaged stock, reallocate fresh units from Zone C Buffer Vault, and fast-track to packing.',
            resolution_status='OPEN',
            created_at=now - timedelta(minutes=40)
        ),
        ExceptionRecord(
            order_id=order_e.id,
            product_id=prod_map['SKU-IND-201'].id,
            exception_type='DELAYED_PACKING',
            severity='MEDIUM',
            impact_summary='Packing Station 03 processing duration exceeded 20 minutes due to custom pallet banding.',
            ai_recommendation='Assign secondary assistant packer from underutilized Zone B.',
            resolution_status='OPEN',
            created_at=now - timedelta(minutes=15)
        )
    ]
    db.session.add_all(exceptions)

    # 11. Seed Notifications & Bottlenecks
    print("Seeding Notifications & Bottleneck Metrics...")
    notifications = [
        Notification(
            title='SLA Risk Alert: Order #ORD-2026-0001',
            message='Critical VIP order requires immediate inventory allocation. SLA expires in 2 hours.',
            severity='CRITICAL',
            category='SLA',
            link_url='/orders/1'
        ),
        Notification(
            title='Inventory Shortage: SKU-ELEC-101',
            message='Sony WH-1000XM5 stock depleted to 7 units against multi-order demand of 15 units.',
            severity='WARNING',
            category='INVENTORY',
            link_url='/allocation'
        ),
        Notification(
            title='Bottleneck Detected: Packing Station 03',
            message='Station queue size reached 8 orders (94% utilization). 34% of today\'s fulfillment delay originates here.',
            severity='ATTENTION',
            category='BOTTLENECK',
            link_url='/analytics'
        ),
        Notification(
            title='AI Recommendation: Replenish Electronics',
            message='Automated purchase orders recommended for 4 critical SKUs to avoid weekend stockout.',
            severity='RECOMMENDATION',
            category='DECISION',
            link_url='/replenishment'
        )
    ]
    db.session.add_all(notifications)

    bottleneck_metric = BottleneckMetric(
        warehouse_id=wh_a.id,
        station_name='Packing Station 03 (Heavy Goods)',
        avg_wait_time_min=24.5,
        current_queue_size=8,
        utilization_pct=94.2,
        delay_contribution_pct=34.0,
        recommended_action='Reassign 1 picker from Zone B to Packing Station 03',
        impact_summary='↓ 18% packing delay, ↑ 14% overall throughput'
    )
    db.session.add(bottleneck_metric)

    # 12. Seed Decision Logs & Audit Logs
    print("Seeding Decision & Audit Logs...")
    dec_log = DecisionLog(
        decision_type='BOTTLENECK_DETECTION',
        context_ref='PACKING_STATION_03',
        score=94.0,
        recommended_action='Reassign 1 picker from Zone B to Packing Station 03',
        reason_json=json.dumps([
            'Packing Station 03 queue at 8 orders (94.2% utilization)',
            'Zone B workload is low (58%) with 3 available pickers',
            'Frees critical packing pipeline without risking Zone B SLAs'
        ]),
        expected_impact='Reduces average packing queue delay by 18% within 45 minutes',
        alternative_action='Hold incoming heavy orders in temporary buffer staging',
        execution_status='RECOMMENDED',
        executed_by='Decision Engine'
    )
    db.session.add(dec_log)

    audit_log = AuditLog(
        entity_type='SYSTEM',
        entity_id='SYS-INIT',
        action='DATABASE_SEEDED',
        performed_by='SmartFulfill Seed Engine',
        details_json=json.dumps({'status': 'SUCCESS', 'products_count': len(products_list), 'orders_count': 54})
    )
    db.session.add(audit_log)
    db.session.commit()

    print("[SUCCESS] Database successfully seeded with full production data and Hackathon Demo Scenario!")

def seed_database():
    """
    Standalone entry point: creates a fresh app, resets the DB, and seeds it.
    Run from the backend/ directory: python seed/seed_data.py
    """
    app = create_app()
    with app.app_context():
        print("Resetting database schema...")
        db.drop_all()
        db.create_all()
        seed_with_context()


if __name__ == '__main__':
    seed_database()
