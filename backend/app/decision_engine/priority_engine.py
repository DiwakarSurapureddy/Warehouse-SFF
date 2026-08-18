from datetime import datetime, timezone

class PriorityEngine:
    """
    Evaluates order attributes to calculate a dynamic priority score (0 - 100)
    and provides a fully transparent, explainable breakdown of why the score was assigned.
    """
    
    PRIORITY_BASE = {
        'CRITICAL': 40,
        'URGENT': 30,
        'HIGH': 20,
        'NORMAL': 10,
        'LOW': 5
    }
    
    TIER_WEIGHT = {
        'VIP': 15,
        'ENTERPRISE': 12,
        'PREMIUM': 8,
        'STANDARD': 3
    }

    @classmethod
    def calculate_priority_score(cls, order, inventory_records=None):
        now = datetime.now(timezone.utc)
        
        # 1. Base Priority Weight (0-40)
        p_base = cls.PRIORITY_BASE.get(order.priority.upper(), 10)
        
        # 2. SLA Urgency Weight (0-30)
        sla_weight = 0
        sla_hours = 999.0
        if order.sla_deadline:
            # Handle both naive and tz-aware
            sla_dt = order.sla_deadline
            if sla_dt.tzinfo is None:
                sla_dt = sla_dt.replace(tzinfo=timezone.utc)
            
            diff_secs = (sla_dt - now).total_seconds()
            sla_hours = max(-10.0, diff_secs / 3600.0)
            
            if sla_hours <= 0:
                sla_weight = 30.0 # SLA expired or due right now
            elif sla_hours <= 2.0:
                sla_weight = 28.0 # Extremely urgent
            elif sla_hours <= 4.0:
                sla_weight = 22.0
            elif sla_hours <= 8.0:
                sla_weight = 15.0
            elif sla_hours <= 24.0:
                sla_weight = max(2.0, (24.0 - sla_hours) / 24.0 * 12.0)
            else:
                sla_weight = 1.0

        # 3. Customer Tier Weight (0-15)
        tier_weight = cls.TIER_WEIGHT.get(order.customer_tier.upper(), 3)

        # 4. Order Age / Waiting Time Weight (0-10)
        age_weight = 0
        waiting_min = 0
        if order.created_at:
            created_dt = order.created_at
            if created_dt.tzinfo is None:
                created_dt = created_dt.replace(tzinfo=timezone.utc)
            waiting_min = max(0, (now - created_dt).total_seconds() / 60.0)
            age_weight = min(10.0, round(waiting_min / 10.0, 1))

        # 5. Inventory Availability Factor (0-5)
        avail_weight = 5.0
        has_shortage = False
        if order.items:
            for item in order.items:
                if item.quantity_allocated < item.quantity_requested and item.status == 'SHORTAGE':
                    avail_weight = 1.0
                    has_shortage = True
                    break

        total_score = min(100.0, round(p_base + sla_weight + tier_weight + age_weight + avail_weight, 1))

        # Build Explainable Reasoning
        reasons = []
        if sla_hours <= 2.0:
            reasons.append(f"SLA deadline in {max(0.1, round(sla_hours, 1))}h (critical delivery window)")
        elif sla_hours <= 6.0:
            reasons.append(f"SLA deadline in {round(sla_hours, 1)}h")
        
        if order.customer_tier.upper() in ['VIP', 'ENTERPRISE']:
            reasons.append(f"High-value {order.customer_tier} customer tier SLA contract")
        
        if order.priority.upper() in ['CRITICAL', 'URGENT']:
            reasons.append(f"Marked as {order.priority} operational priority")
        
        if waiting_min > 30:
            reasons.append(f"Order has been waiting in queue for {int(waiting_min)} minutes")
        
        if has_shortage:
            reasons.append("Inventory shortage detected - requires immediate allocation intervention")
        else:
            reasons.append("Stock availability confirmed across designated warehouse zones")

        breakdown = {
            'base_priority_points': p_base,
            'sla_urgency_points': round(sla_weight, 1),
            'customer_tier_points': tier_weight,
            'order_age_points': round(age_weight, 1),
            'availability_points': avail_weight,
            'sla_hours_remaining': round(sla_hours, 1),
            'waiting_minutes': int(waiting_min)
        }

        classification = 'CRITICAL' if total_score >= 80 else ('HIGH' if total_score >= 60 else ('NORMAL' if total_score >= 35 else 'LOW'))

        return {
            'score': total_score,
            'classification': classification,
            'breakdown': breakdown,
            'reasons': reasons,
            'summary': f"Priority Score: {int(total_score)}/100 ({classification}) — {reasons[0] if reasons else 'Normal queue'}"
        }
