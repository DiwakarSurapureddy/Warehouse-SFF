from datetime import datetime, timezone
from app.models.models import Order, Product, Inventory, PickingTask, PackingTask

class SimulatorService:
    """
    Simulates operational stress tests, demand shocks, labor shortages, and supply chain delays
    to forecast impact on SLA fulfillment rates, cycle times, and recommend mitigations.
    """

    SCENARIO_PRESETS = {
        'DEMAND_SURGE_20': {
            'name': 'E-Commerce Demand Surge (+20%)',
            'demand_multiplier': 1.20,
            'high_priority_surge': 1.15,
            'supplier_delay_days': 0,
            'worker_availability_pct': 100,
            'zone_offline': False,
            'description': 'Simulates seasonal promotions or flash sales resulting in 20% increased order volume.'
        },
        'DEMAND_SURGE_50': {
            'name': 'Black Friday Peak Demand (+50%)',
            'demand_multiplier': 1.50,
            'high_priority_surge': 1.40,
            'supplier_delay_days': 0,
            'worker_availability_pct': 90,
            'zone_offline': False,
            'description': 'Simulates massive peak traffic with carrier volume caps and labor pressure.'
        },
        'SUPPLIER_DELAY_5D': {
            'name': 'Major Supplier Transit Delay (+5 Days)',
            'demand_multiplier': 1.0,
            'high_priority_surge': 1.0,
            'supplier_delay_days': 5,
            'worker_availability_pct': 100,
            'zone_offline': False,
            'description': 'Simulates port/customs delay on raw materials & incoming shipments.'
        },
        'LABOR_SHORTAGE_30': {
            'name': 'Unplanned Shift Absenteeism (-30% Staff)',
            'demand_multiplier': 1.0,
            'high_priority_surge': 1.0,
            'supplier_delay_days': 0,
            'worker_availability_pct': 70,
            'zone_offline': False,
            'description': 'Simulates unexpected staff shortages during night or weekend shifts.'
        },
        'ZONE_A_CONGESTION': {
            'name': 'High-Velocity Zone A Conveyor Failure',
            'demand_multiplier': 1.0,
            'high_priority_surge': 1.0,
            'supplier_delay_days': 0,
            'worker_availability_pct': 100,
            'zone_offline': True,
            'description': 'Simulates equipment stoppage in the primary fast-moving items zone.'
        }
    }

    @classmethod
    def run_simulation(cls, params):
        """
        Calculates baseline vs simulated metrics based on input parameters:
        - demand_multiplier (e.g. 1.25)
        - priority_boost_pct (e.g. 20%)
        - supplier_delay_days (e.g. 4)
        - labor_capacity_pct (e.g. 80%)
        - zone_offline (bool)
        """
        demand_mult = float(params.get('demand_multiplier', 1.20))
        priority_surge = float(params.get('priority_surge', 1.10))
        supplier_delay = int(params.get('supplier_delay_days', 0))
        labor_pct = float(params.get('labor_capacity_pct', 100.0)) / 100.0
        zone_offline = bool(params.get('zone_offline', False))

        # Current Baseline Metrics
        total_orders = max(Order.query.count(), 45)
        baseline_fulfillment_rate = 92.4
        baseline_avg_cycle_time_min = 28.5
        baseline_sla_breach_count = 2
        baseline_utilization_pct = 74.0
        baseline_stockout_risk_skus = 3

        # Simulated Calculation
        # Higher demand and lower labor increases cycle time and lowers fulfillment rate
        labor_factor = max(0.4, labor_pct)
        load_factor = demand_mult / labor_factor

        simulated_cycle_time = round(baseline_avg_cycle_time_min * load_factor * (1.3 if zone_offline else 1.0), 1)
        
        # Fulfillment rate degradation
        fulfillment_drop = (demand_mult - 1.0) * 22.0 + (1.0 - labor_pct) * 28.0 + (supplier_delay * 1.8) + (14.0 if zone_offline else 0.0)
        simulated_fulfillment_rate = max(45.0, round(baseline_fulfillment_rate - fulfillment_drop, 1))

        simulated_sla_breaches = int(baseline_sla_breach_count + max(0, (load_factor - 1.0) * 12) + (supplier_delay * 2) + (4 if zone_offline else 0))
        simulated_utilization = min(100.0, round(baseline_utilization_pct * load_factor, 1))
        simulated_stockout_skus = baseline_stockout_risk_skus + int((demand_mult - 1.0) * 10) + supplier_delay

        # Formulate Targeted Recommendations
        mitigations = []
        if demand_mult > 1.15 and labor_pct >= 0.9:
            mitigations.append("+1 Temporary Picker in Zone A and +1 Packer at Station 03")
            mitigations.append(f"Generate batch replenishment order for top 5 fast-moving SKUs")
        
        if labor_pct < 0.85:
            mitigations.append("Cross-train QC inspectors to assist packing queue")
            mitigations.append("Enable high-density wave picking to minimize route steps")

        if supplier_delay > 0:
            mitigations.append(f"Activate secondary supplier with {supplier_delay}d shorter lead time")
            mitigations.append("Reroute pending orders to Warehouse B backup stock")

        if zone_offline:
            mitigations.append("Reroute automated conveyer traffic through Zone B buffer aisles")
            mitigations.append("Deploy manual cart runners for high-priority SKUs")

        if not mitigations:
            mitigations.append("Current operational capacity is sufficient to absorb parameters")

        # Predicted Recovery with Mitigation
        mitigated_fulfillment_rate = min(96.0, round(simulated_fulfillment_rate + (baseline_fulfillment_rate - simulated_fulfillment_rate) * 0.75, 1))
        mitigated_cycle_time = round(simulated_cycle_time * 0.78, 1)

        return {
            'scenario_name': params.get('scenario_name', 'Custom Scenario Simulation'),
            'inputs': {
                'demand_multiplier': demand_mult,
                'priority_surge': priority_surge,
                'supplier_delay_days': supplier_delay,
                'labor_capacity_pct': round(labor_pct * 100, 1),
                'zone_offline': zone_offline
            },
            'baseline': {
                'fulfillment_rate_pct': baseline_fulfillment_rate,
                'avg_cycle_time_min': baseline_avg_cycle_time_min,
                'sla_breach_count': baseline_sla_breach_count,
                'warehouse_utilization_pct': baseline_utilization_pct,
                'stockout_risk_skus': baseline_stockout_risk_skus
            },
            'simulated': {
                'fulfillment_rate_pct': simulated_fulfillment_rate,
                'avg_cycle_time_min': simulated_cycle_time,
                'sla_breach_count': simulated_sla_breaches,
                'warehouse_utilization_pct': simulated_utilization,
                'stockout_risk_skus': simulated_stockout_skus
            },
            'mitigated_projection': {
                'fulfillment_rate_pct': mitigated_fulfillment_rate,
                'avg_cycle_time_min': mitigated_cycle_time,
                'sla_breach_count': max(1, simulated_sla_breaches // 3)
            },
            'recommended_actions': mitigations,
            'summary': f"Under simulated stress, fulfillment drops from {baseline_fulfillment_rate}% to {simulated_fulfillment_rate}%. Implementing AI recommendations restores throughput to {mitigated_fulfillment_rate}%."
        }
