from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import json

db = SQLAlchemy()

def utcnow():
    return datetime.now(timezone.utc)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='manager') # admin, manager, picker, packer, inventory
    full_name = db.Column(db.String(120), nullable=False)
    department = db.Column(db.String(100), default='Operations')
    avatar_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'full_name': self.full_name,
            'department': self.department,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Warehouse(db.Model):
    __tablename__ = 'warehouses'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    capacity_sqft = db.Column(db.Integer, default=50000)
    current_workload_pct = db.Column(db.Float, default=65.0) # 0 - 100%
    status = db.Column(db.String(30), default='ACTIVE') # ACTIVE, MAINTENANCE, CONGESTED
    created_at = db.Column(db.DateTime, default=utcnow)

    zones = db.relationship('Zone', backref='warehouse', lazy=True, cascade='all, delete-orphan')
    inventory_items = db.relationship('Inventory', backref='warehouse', lazy=True)
    orders = db.relationship('Order', backref='warehouse', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'location': self.location,
            'capacity_sqft': self.capacity_sqft,
            'current_workload_pct': self.current_workload_pct,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Zone(db.Model):
    __tablename__ = 'zones'
    id = db.Column(db.Integer, primary_key=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    code = db.Column(db.String(20), nullable=False) # e.g. Zone A, Zone B
    name = db.Column(db.String(100), nullable=False)
    zone_type = db.Column(db.String(50), default='High-Velocity') # High-Velocity, Bulk, Fragile, Cold, Staging
    workload_pct = db.Column(db.Float, default=50.0)
    picker_count = db.Column(db.Integer, default=2)

    bins = db.relationship('Bin', backref='zone', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'warehouse_id': self.warehouse_id,
            'code': self.code,
            'name': self.name,
            'zone_type': self.zone_type,
            'workload_pct': self.workload_pct,
            'picker_count': self.picker_count
        }

class Bin(db.Model):
    __tablename__ = 'bins'
    id = db.Column(db.Integer, primary_key=True)
    zone_id = db.Column(db.Integer, db.ForeignKey('zones.id'), nullable=False)
    code = db.Column(db.String(30), nullable=False) # e.g. A01, A02, B01
    aisle = db.Column(db.String(10), nullable=False)
    shelf = db.Column(db.String(10), nullable=False)
    level = db.Column(db.String(10), nullable=False)
    x_coord = db.Column(db.Float, default=0.0)
    y_coord = db.Column(db.Float, default=0.0)
    capacity_units = db.Column(db.Integer, default=500)

    inventory_items = db.relationship('Inventory', backref='bin', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'zone_id': self.zone_id,
            'code': self.code,
            'aisle': self.aisle,
            'shelf': self.shelf,
            'level': self.level,
            'x_coord': self.x_coord,
            'y_coord': self.y_coord,
            'capacity_units': self.capacity_units
        }

class Supplier(db.Model):
    __tablename__ = 'suppliers'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(30), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    contact_email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    lead_time_days = db.Column(db.Integer, default=3)
    reliability_score = db.Column(db.Float, default=95.0) # 0-100%

    products = db.relationship('Product', backref='supplier', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'contact_email': self.contact_email,
            'phone': self.phone,
            'lead_time_days': self.lead_time_days,
            'reliability_score': self.reliability_score
        }

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    barcode = db.Column(db.String(80), nullable=True)
    unit_cost = db.Column(db.Float, default=0.0)
    unit_price = db.Column(db.Float, default=0.0)
    weight_kg = db.Column(db.Float, default=1.0)
    dimensions_cm = db.Column(db.String(50), default='20x15x10')
    min_safety_stock = db.Column(db.Integer, default=15)
    reorder_point = db.Column(db.Integer, default=30)
    reorder_quantity = db.Column(db.Integer, default=100)
    avg_daily_demand = db.Column(db.Float, default=8.5)
    default_supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    inventory_records = db.relationship('Inventory', backref='product', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        # compute aggregate stock metrics across all warehouses
        total_stk = sum(inv.total_stock for inv in self.inventory_records)
        reserved_stk = sum(inv.reserved_stock for inv in self.inventory_records)
        damaged_stk = sum(inv.damaged_stock for inv in self.inventory_records)
        missing_stk = sum(inv.missing_stock for inv in self.inventory_records)
        available_stk = max(0, total_stk - reserved_stk - damaged_stk - missing_stk)

        days_remaining = round(available_stk / self.avg_daily_demand, 1) if self.avg_daily_demand > 0 else 999.0
        
        # Determine overall health status
        if available_stk <= 0:
            health = 'OUT_OF_STOCK'
        elif available_stk <= self.reorder_point:
            health = 'LOW_STOCK'
        elif available_stk > self.reorder_point * 3:
            health = 'OVERSTOCK'
        elif damaged_stk > 0:
            health = 'DAMAGED'
        elif missing_stk > 0:
            health = 'MISSING'
        else:
            health = 'HEALTHY'

        return {
            'id': self.id,
            'sku': self.sku,
            'name': self.name,
            'category': self.category,
            'barcode': self.barcode,
            'unit_cost': self.unit_cost,
            'unit_price': self.unit_price,
            'weight_kg': self.weight_kg,
            'dimensions_cm': self.dimensions_cm,
            'min_safety_stock': self.min_safety_stock,
            'reorder_point': self.reorder_point,
            'reorder_quantity': self.reorder_quantity,
            'avg_daily_demand': self.avg_daily_demand,
            'default_supplier_id': self.default_supplier_id,
            'supplier_name': self.supplier.name if self.supplier else 'Direct OEM',
            'lead_time_days': self.supplier.lead_time_days if self.supplier else 3,
            'image_url': self.image_url,
            'total_stock': total_stk,
            'reserved_stock': reserved_stk,
            'damaged_stock': damaged_stk,
            'missing_stock': missing_stk,
            'available_stock': available_stk,
            'days_remaining': days_remaining,
            'health_status': health,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Inventory(db.Model):
    __tablename__ = 'inventory'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    bin_id = db.Column(db.Integer, db.ForeignKey('bins.id'), nullable=False)
    total_stock = db.Column(db.Integer, default=0, nullable=False)
    reserved_stock = db.Column(db.Integer, default=0, nullable=False)
    damaged_stock = db.Column(db.Integer, default=0, nullable=False)
    missing_stock = db.Column(db.Integer, default=0, nullable=False)
    batch_no = db.Column(db.String(50), nullable=True)
    last_restocked = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    allocations = db.relationship('Allocation', backref='inventory', lazy=True)

    @property
    def available_stock(self):
        return max(0, self.total_stock - self.reserved_stock - self.damaged_stock - self.missing_stock)

    @property
    def health_status(self):
        avail = self.available_stock
        product = self.product
        reorder_pt = product.reorder_point if product else 20
        if avail <= 0:
            return 'OUT_OF_STOCK'
        elif avail <= reorder_pt:
            return 'LOW_STOCK'
        elif avail > reorder_pt * 3:
            return 'OVERSTOCK'
        elif self.damaged_stock > 0:
            return 'DAMAGED'
        elif self.missing_stock > 0:
            return 'MISSING'
        return 'HEALTHY'

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_sku': self.product.sku if self.product else '',
            'product_name': self.product.name if self.product else '',
            'category': self.product.category if self.product else '',
            'unit_cost': self.product.unit_cost if self.product else 0,
            'warehouse_id': self.warehouse_id,
            'warehouse_code': self.warehouse.code if self.warehouse else '',
            'warehouse_name': self.warehouse.name if self.warehouse else '',
            'bin_id': self.bin_id,
            'bin_code': self.bin.code if self.bin else '',
            'zone_code': self.bin.zone.code if self.bin and self.bin.zone else '',
            'zone_name': self.bin.zone.name if self.bin and self.bin.zone else '',
            'total_stock': self.total_stock,
            'reserved_stock': self.reserved_stock,
            'damaged_stock': self.damaged_stock,
            'missing_stock': self.missing_stock,
            'available_stock': self.available_stock,
            'health_status': self.health_status,
            'batch_no': self.batch_no,
            'last_restocked': self.last_restocked.isoformat() if self.last_restocked else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_name = db.Column(db.String(150), nullable=False)
    customer_tier = db.Column(db.String(50), default='STANDARD') # VIP, ENTERPRISE, PREMIUM, STANDARD
    priority = db.Column(db.String(30), default='NORMAL') # CRITICAL, URGENT, HIGH, NORMAL, LOW
    sla_deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), default='CREATED') 
    # CREATED, ALLOCATED, PARTIALLY_ALLOCATED, BACKORDERED, PICKING, PICKED, PACKING, PACKED, QC_PENDING, QC_PASSED, QC_FAILED, DISPATCHED, CANCELLED
    total_amount = db.Column(db.Float, default=0.0)
    priority_score = db.Column(db.Float, default=0.0)
    priority_breakdown = db.Column(db.Text, nullable=True) # JSON string of score factors
    priority_reason = db.Column(db.String(255), nullable=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)
    dispatched_at = db.Column(db.DateTime, nullable=True)

    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    picking_tasks = db.relationship('PickingTask', backref='order', lazy=True, cascade='all, delete-orphan')
    packing_tasks = db.relationship('PackingTask', backref='order', lazy=True, cascade='all, delete-orphan')
    quality_checks = db.relationship('QualityCheck', backref='order', lazy=True, cascade='all, delete-orphan')
    exceptions = db.relationship('ExceptionRecord', backref='order', lazy=True, cascade='all, delete-orphan')
    allocations = db.relationship('Allocation', backref='order', lazy=True, cascade='all, delete-orphan')

    @property
    def is_sla_risk(self):
        if self.status in ['DISPATCHED', 'COMPLETED', 'CANCELLED']:
            return False
        if not self.sla_deadline:
            return False
        now = datetime.now(timezone.utc)
        deadline = self.sla_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        diff_hours = (deadline - now).total_seconds() / 3600.0
        return diff_hours <= 3.0 # Within 3 hours or expired

    @property
    def hours_until_sla(self):
        if not self.sla_deadline:
            return 999.0
        now = datetime.now(timezone.utc)
        deadline = self.sla_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        return round((deadline - now).total_seconds() / 3600.0, 1)

    def to_dict(self, include_items=True):
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'customer_name': self.customer_name,
            'customer_tier': self.customer_tier,
            'priority': self.priority,
            'sla_deadline': self.sla_deadline.isoformat() if self.sla_deadline else None,
            'hours_until_sla': self.hours_until_sla,
            'is_sla_risk': self.is_sla_risk,
            'status': self.status,
            'total_amount': self.total_amount,
            'priority_score': self.priority_score,
            'priority_breakdown': json.loads(self.priority_breakdown) if self.priority_breakdown else {},
            'priority_reason': self.priority_reason,
            'warehouse_id': self.warehouse_id,
            'warehouse_code': self.warehouse.code if self.warehouse else '',
            'warehouse_name': self.warehouse.name if self.warehouse else '',
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'dispatched_at': self.dispatched_at.isoformat() if self.dispatched_at else None,
            'items_count': sum(item.quantity_requested for item in self.items),
            'allocated_count': sum(item.quantity_allocated for item in self.items),
            'exceptions_count': len([e for e in self.exceptions if e.resolution_status != 'RESOLVED'])
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        return data

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity_requested = db.Column(db.Integer, nullable=False)
    quantity_allocated = db.Column(db.Integer, default=0)
    quantity_picked = db.Column(db.Integer, default=0)
    quantity_packed = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='PENDING') # PENDING, ALLOCATED, SHORTAGE, PICKED, PACKED

    product = db.relationship('Product', lazy=True)
    allocations = db.relationship('Allocation', backref='order_item', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'sku': self.product.sku if self.product else '',
            'name': self.product.name if self.product else '',
            'category': self.product.category if self.product else '',
            'unit_price': self.product.unit_price if self.product else 0,
            'unit_cost': self.product.unit_cost if self.product else 0,
            'weight_kg': self.product.weight_kg if self.product else 1,
            'quantity_requested': self.quantity_requested,
            'quantity_allocated': self.quantity_allocated,
            'quantity_picked': self.quantity_picked,
            'quantity_packed': self.quantity_packed,
            'status': self.status,
            'shortage': max(0, self.quantity_requested - self.quantity_allocated)
        }

class Allocation(db.Model):
    __tablename__ = 'allocations'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    order_item_id = db.Column(db.Integer, db.ForeignKey('order_items.id'), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), default='ACTIVE') # ACTIVE, RELEASED, PICKED
    decision_reason = db.Column(db.Text, nullable=True)
    allocated_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'order_item_id': self.order_item_id,
            'inventory_id': self.inventory_id,
            'quantity': self.quantity,
            'status': self.status,
            'decision_reason': self.decision_reason,
            'bin_code': self.inventory.bin.code if self.inventory and self.inventory.bin else '',
            'zone_code': self.inventory.bin.zone.code if self.inventory and self.inventory.bin and self.inventory.bin.zone else '',
            'warehouse_code': self.inventory.warehouse.code if self.inventory and self.inventory.warehouse else '',
            'allocated_at': self.allocated_at.isoformat() if self.allocated_at else None
        }

class PickingTask(db.Model):
    __tablename__ = 'picking_tasks'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    assigned_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(50), default='QUEUED') # QUEUED, IN_PROGRESS, PAUSED, COMPLETED, EXCEPTION
    total_items = db.Column(db.Integer, default=0)
    picked_items = db.Column(db.Integer, default=0)
    estimated_distance_m = db.Column(db.Float, default=45.0)
    estimated_time_min = db.Column(db.Float, default=8.0)
    route_sequence_json = db.Column(db.Text, nullable=True) # sequence of bins & items
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    assigned_user = db.relationship('User', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'order_number': self.order.order_number if self.order else '',
            'priority': self.order.priority if self.order else 'NORMAL',
            'assigned_user_id': self.assigned_user_id,
            'assigned_user_name': self.assigned_user.full_name if self.assigned_user else 'Unassigned',
            'status': self.status,
            'total_items': self.total_items,
            'picked_items': self.picked_items,
            'completion_pct': round((self.picked_items / self.total_items * 100) if self.total_items > 0 else 0, 1),
            'estimated_distance_m': self.estimated_distance_m,
            'estimated_time_min': self.estimated_time_min,
            'route_sequence': json.loads(self.route_sequence_json) if self.route_sequence_json else [],
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class PackingTask(db.Model):
    __tablename__ = 'packing_tasks'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    picking_task_id = db.Column(db.Integer, db.ForeignKey('picking_tasks.id'), nullable=True)
    assigned_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(50), default='WAITING') # WAITING, PACKING, PACKED, QUALITY_CHECK, COMPLETED
    recommended_box_type = db.Column(db.String(50), default='Box-M (Standard Cardboard)')
    actual_weight_kg = db.Column(db.Float, default=2.5)
    dimensions_cm = db.Column(db.String(50), default='30x20x15')
    packaging_notes = db.Column(db.Text, nullable=True)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    assigned_user = db.relationship('User', lazy=True)
    picking_task = db.relationship('PickingTask', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'order_number': self.order.order_number if self.order else '',
            'picking_task_id': self.picking_task_id,
            'assigned_user_id': self.assigned_user_id,
            'assigned_user_name': self.assigned_user.full_name if self.assigned_user else 'Unassigned',
            'status': self.status,
            'recommended_box_type': self.recommended_box_type,
            'actual_weight_kg': self.actual_weight_kg,
            'dimensions_cm': self.dimensions_cm,
            'packaging_notes': self.packaging_notes,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class QualityCheck(db.Model):
    __tablename__ = 'quality_checks'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    packing_task_id = db.Column(db.Integer, db.ForeignKey('packing_tasks.id'), nullable=True)
    inspector_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(30), default='PENDING') # PENDING, PASS, FAIL, HOLD
    sku_verified = db.Column(db.Boolean, default=True)
    quantity_verified = db.Column(db.Boolean, default=True)
    condition_verified = db.Column(db.Boolean, default=True)
    packaging_verified = db.Column(db.Boolean, default=True)
    label_verified = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text, nullable=True)
    checked_at = db.Column(db.DateTime, default=utcnow)

    inspector = db.relationship('User', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'order_number': self.order.order_number if self.order else '',
            'packing_task_id': self.packing_task_id,
            'inspector_id': self.inspector_id,
            'inspector_name': self.inspector.full_name if self.inspector else 'System Auto-QC',
            'status': self.status,
            'checklist': {
                'sku_verified': self.sku_verified,
                'quantity_verified': self.quantity_verified,
                'condition_verified': self.condition_verified,
                'packaging_verified': self.packaging_verified,
                'label_verified': self.label_verified
            },
            'notes': self.notes,
            'checked_at': self.checked_at.isoformat() if self.checked_at else None
        }

class ExceptionRecord(db.Model):
    __tablename__ = 'exceptions'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    order_item_id = db.Column(db.Integer, db.ForeignKey('order_items.id'), nullable=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    exception_type = db.Column(db.String(80), nullable=False) 
    # DAMAGED_ITEM, MISSING_ITEM, STOCK_SHORTAGE, WRONG_ITEM, WRONG_QTY, DELAYED_PICKING, DELAYED_PACKING, SLA_RISK, INVENTORY_MISMATCH, FAILED_QC
    severity = db.Column(db.String(30), default='MEDIUM') # CRITICAL, HIGH, MEDIUM, LOW
    impact_summary = db.Column(db.Text, nullable=False)
    ai_recommendation = db.Column(db.Text, nullable=False)
    resolution_status = db.Column(db.String(40), default='OPEN') # OPEN, IN_REVIEW, RESOLVED, REJECTED
    resolution_action = db.Column(db.Text, nullable=True)
    resolved_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    product = db.relationship('Product', lazy=True)
    resolved_by = db.relationship('User', lazy=True)

    @property
    def sku(self):
        return self.product.sku if self.product else 'N/A'

    @property
    def product_name(self):
        return self.product.name if self.product else 'N/A'

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'order_number': self.order.order_number if self.order else 'N/A',
            'order_item_id': self.order_item_id,
            'product_id': self.product_id,
            'sku': self.product.sku if self.product else 'N/A',
            'product_name': self.product.name if self.product else 'N/A',
            'exception_type': self.exception_type,
            'severity': self.severity,
            'impact_summary': self.impact_summary,
            'ai_recommendation': self.ai_recommendation,
            'resolution_status': self.resolution_status,
            'resolution_action': self.resolution_action,
            'resolved_by_user_id': self.resolved_by_user_id,
            'resolved_by_name': self.resolved_by.full_name if self.resolved_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(30), default='ATTENTION') # CRITICAL, WARNING, ATTENTION, RECOMMENDATION
    is_read = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50), default='OPERATIONS') # SLA, INVENTORY, BOTTLENECK, EXCEPTION, DECISION
    link_url = db.Column(db.String(150), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'severity': self.severity,
            'is_read': self.is_read,
            'category': self.category,
            'link_url': self.link_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DecisionLog(db.Model):
    __tablename__ = 'decision_logs'
    id = db.Column(db.Integer, primary_key=True)
    decision_type = db.Column(db.String(80), nullable=False) # ALLOCATION, PRIORITIZATION, REPLENISHMENT, ROUTING, RESOLUTION, BOTTLENECK_MITIGATION
    context_ref = db.Column(db.String(100), nullable=False) # e.g. ORD-1024, SKU-205, PACKING_STATION_03
    score = db.Column(db.Float, default=0.0)
    recommended_action = db.Column(db.Text, nullable=False)
    reason_json = db.Column(db.Text, nullable=False) # List of bullet points / factors
    expected_impact = db.Column(db.Text, nullable=False)
    alternative_action = db.Column(db.Text, nullable=True)
    execution_status = db.Column(db.String(30), default='RECOMMENDED') # RECOMMENDED, APPROVED, AUTO_EXECUTED, REJECTED
    executed_by = db.Column(db.String(100), default='AI Engine')
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'decision_type': self.decision_type,
            'context_ref': self.context_ref,
            'score': self.score,
            'recommended_action': self.recommended_action,
            'reasons': json.loads(self.reason_json) if self.reason_json else [],
            'expected_impact': self.expected_impact,
            'alternative_action': self.alternative_action,
            'execution_status': self.execution_status,
            'executed_by': self.executed_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ReplenishmentRecommendation(db.Model):
    __tablename__ = 'replenishment_recommendations'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    current_stock = db.Column(db.Integer, default=0)
    reorder_point = db.Column(db.Integer, default=0)
    recommended_quantity = db.Column(db.Integer, default=100)
    urgency = db.Column(db.String(30), default='HIGH') # CRITICAL, HIGH, NORMAL
    estimated_lead_time_days = db.Column(db.Integer, default=3)
    status = db.Column(db.String(40), default='PENDING') # PENDING, APPROVED, ORDERED, CANCELLED
    created_at = db.Column(db.DateTime, default=utcnow)

    product = db.relationship('Product', lazy=True)
    warehouse = db.relationship('Warehouse', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'sku': self.product.sku if self.product else '',
            'product_name': self.product.name if self.product else '',
            'category': self.product.category if self.product else '',
            'unit_cost': self.product.unit_cost if self.product else 0,
            'supplier_name': self.product.supplier.name if self.product and self.product.supplier else 'Direct OEM',
            'warehouse_id': self.warehouse_id,
            'warehouse_code': self.warehouse.code if self.warehouse else '',
            'current_stock': self.current_stock,
            'reorder_point': self.reorder_point,
            'recommended_quantity': self.recommended_quantity,
            'total_estimated_cost': round((self.product.unit_cost if self.product else 0) * self.recommended_quantity, 2),
            'urgency': self.urgency,
            'estimated_lead_time_days': self.estimated_lead_time_days,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class BottleneckMetric(db.Model):
    __tablename__ = 'bottleneck_metrics'
    id = db.Column(db.Integer, primary_key=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    station_name = db.Column(db.String(100), nullable=False) # e.g. Packing Station 03, Zone B Picking Line, QC Station 01
    avg_wait_time_min = db.Column(db.Float, default=15.0)
    current_queue_size = db.Column(db.Integer, default=8)
    utilization_pct = db.Column(db.Float, default=92.0)
    delay_contribution_pct = db.Column(db.Float, default=32.0)
    recommended_action = db.Column(db.Text, nullable=False)
    impact_summary = db.Column(db.Text, nullable=False)
    recorded_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'warehouse_id': self.warehouse_id,
            'station_name': self.station_name,
            'avg_wait_time_min': self.avg_wait_time_min,
            'current_queue_size': self.current_queue_size,
            'utilization_pct': self.utilization_pct,
            'delay_contribution_pct': self.delay_contribution_pct,
            'recommended_action': self.recommended_action,
            'impact_summary': self.impact_summary,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    entity_type = db.Column(db.String(50), nullable=False) # ORDER, INVENTORY, ALLOCATION, PICKING, PACKING, QC, EXCEPTION, DECISION
    entity_id = db.Column(db.String(50), nullable=False)
    action = db.Column(db.String(100), nullable=False) # CREATED, ALLOCATED, PICK_STARTED, QC_FAILED, RESOLVED, DISPATCHED, OVERRIDDEN
    performed_by = db.Column(db.String(100), default='System')
    details_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'action': self.action,
            'performed_by': self.performed_by,
            'details': json.loads(self.details_json) if self.details_json else {},
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
