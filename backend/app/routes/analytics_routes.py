from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from app.models.models import db, Order, Inventory, ExceptionRecord, Product, Zone
from app.decision_engine.bottleneck_detector import BottleneckDetector

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('', methods=['GET'])
def get_analytics():
    timeframe = request.args.get('timeframe', 'daily') # daily, weekly, monthly
    
    # 1. Orders by Status
    all_orders = Order.query.all()
    status_counts = {}
    for o in all_orders:
        s = o.status
        status_counts[s] = status_counts.get(s, 0) + 1

    orders_by_status = [{'name': k, 'value': v} for k, v in status_counts.items()]

    # 2. Orders by Priority
    priority_counts = {'CRITICAL': 0, 'URGENT': 0, 'HIGH': 0, 'NORMAL': 0, 'LOW': 0}
    for o in all_orders:
        p = o.priority.upper()
        if p in priority_counts:
            priority_counts[p] += 1
        else:
            priority_counts['NORMAL'] += 1

    orders_by_priority = [{'priority': k, 'count': v} for k, v in priority_counts.items()]

    # 3. Stage Duration Breakdown (Minutes)
    stage_durations = [
        {'stage': 'Allocation & Check', 'target_min': 2.0, 'actual_min': 2.4, 'benchmark_min': 3.0},
        {'stage': 'Picking Route', 'target_min': 10.0, 'actual_min': 8.5, 'benchmark_min': 12.0},
        {'stage': 'Packing Station', 'target_min': 6.0, 'actual_min': 14.8, 'benchmark_min': 8.0}, # Bottleneck!
        {'stage': 'Quality Inspection', 'target_min': 3.0, 'actual_min': 4.2, 'benchmark_min': 4.0},
        {'stage': 'Dispatch Loading', 'target_min': 4.0, 'actual_min': 3.6, 'benchmark_min': 5.0}
    ]

    # 4. Hourly / Daily Throughput Trend
    if timeframe == 'monthly':
        throughput_trend = [
            {'label': 'Week 1', 'orders_received': 340, 'orders_fulfilled': 328, 'sla_breaches': 4},
            {'label': 'Week 2', 'orders_received': 410, 'orders_fulfilled': 392, 'sla_breaches': 6},
            {'label': 'Week 3', 'orders_received': 480, 'orders_fulfilled': 465, 'sla_breaches': 3},
            {'label': 'Week 4 (Current)', 'orders_received': 520, 'orders_fulfilled': 498, 'sla_breaches': 2}
        ]
    elif timeframe == 'weekly':
        throughput_trend = [
            {'label': 'Mon', 'orders_received': 62, 'orders_fulfilled': 60, 'sla_breaches': 1},
            {'label': 'Tue', 'orders_received': 78, 'orders_fulfilled': 74, 'sla_breaches': 2},
            {'label': 'Wed', 'orders_received': 85, 'orders_fulfilled': 81, 'sla_breaches': 1},
            {'label': 'Thu', 'orders_received': 92, 'orders_fulfilled': 89, 'sla_breaches': 0},
            {'label': 'Fri', 'orders_received': 110, 'orders_fulfilled': 102, 'sla_breaches': 3},
            {'label': 'Sat', 'orders_received': 68, 'orders_fulfilled': 67, 'sla_breaches': 0},
            {'label': 'Sun (Today)', 'orders_received': 74, 'orders_fulfilled': 69, 'sla_breaches': 1}
        ]
    else: # daily
        throughput_trend = [
            {'label': '08:00', 'orders_received': 12, 'orders_fulfilled': 10, 'sla_breaches': 0},
            {'label': '10:00', 'orders_received': 24, 'orders_fulfilled': 21, 'sla_breaches': 1},
            {'label': '12:00', 'orders_received': 32, 'orders_fulfilled': 28, 'sla_breaches': 0},
            {'label': '14:00', 'orders_received': 28, 'orders_fulfilled': 24, 'sla_breaches': 1},
            {'label': '16:00', 'orders_received': 38, 'orders_fulfilled': 34, 'sla_breaches': 0},
            {'label': '18:00', 'orders_received': 18, 'orders_fulfilled': 17, 'sla_breaches': 0}
        ]

    # 5. Zone Workload & Picker Distribution
    zone_workload = [
        {'zone': 'Zone A (Fast Moving)', 'workload_pct': 88.0, 'pickers_assigned': 4, 'avg_pick_sec': 18},
        {'zone': 'Zone B (Bulk / Hardware)', 'workload_pct': 58.0, 'pickers_assigned': 3, 'avg_pick_sec': 26},
        {'zone': 'Zone C (Fragile / Cold)', 'workload_pct': 64.0, 'pickers_assigned': 2, 'avg_pick_sec': 32},
        {'zone': 'Staging Dock 01', 'workload_pct': 72.0, 'pickers_assigned': 2, 'avg_pick_sec': 14}
    ]

    # 6. Exceptions by Category
    all_exceptions = ExceptionRecord.query.all()
    exc_type_counts = {}
    for e in all_exceptions:
        t = e.exception_type.replace('_', ' ').title()
        exc_type_counts[t] = exc_type_counts.get(t, 0) + 1

    exceptions_breakdown = [{'name': k, 'count': v} for k, v in exc_type_counts.items()]

    # 7. Bottleneck Diagnostics
    bottlenecks = BottleneckDetector.analyze_bottlenecks()

    return jsonify({
        'timeframe': timeframe,
        'orders_by_status': orders_by_status,
        'orders_by_priority': orders_by_priority,
        'stage_durations': stage_durations,
        'throughput_trend': throughput_trend,
        'zone_workload': zone_workload,
        'exceptions_breakdown': exceptions_breakdown,
        'bottleneck_diagnostics': bottlenecks
    }), 200
