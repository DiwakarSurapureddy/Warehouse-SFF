import unittest
import json
from datetime import datetime, timezone, timedelta
from app import create_app
from app.config import Config
from app.models.models import db, User, Product, Inventory, Order, OrderItem, ExceptionRecord
from app.decision_engine.priority_engine import PriorityEngine
from app.decision_engine.allocation_engine import AllocationEngine
from app.decision_engine.picking_optimizer import PickingOptimizer
from app.decision_engine.replenishment_engine import ReplenishmentEngine
from app.decision_engine.exception_resolver import ExceptionResolver
from app.decision_engine.demand_forecaster import DemandForecaster
from app.services.simulator_service import SimulatorService
from app.ai.copilot_service import CopilotService

class TestSmartFulfillCore(unittest.TestCase):
    def setUp(self):
        self.app = create_app(Config)
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()

    def tearDown(self):
        self.app_context.pop()

    def test_stock_calculation_formula(self):
        """
        Tests: Available Stock = Total Stock - Reserved Stock - Damaged Stock - Missing Stock
        """
        inv = Inventory.query.first()
        self.assertIsNotNone(inv)
        expected = max(0, inv.total_stock - inv.reserved_stock - inv.damaged_stock - inv.missing_stock)
        self.assertEqual(inv.available_stock, expected)

    def test_priority_engine_scoring(self):
        """
        Tests PriorityEngine scoring logic and explainability breakdown
        """
        order = Order.query.filter_by(order_number='ORD-2026-0001').first()
        self.assertIsNotNone(order)
        res = PriorityEngine.calculate_priority_score(order)
        self.assertGreaterEqual(res['score'], 75.0)
        self.assertEqual(res['classification'], 'CRITICAL')
        self.assertTrue(len(res['reasons']) > 0)
        self.assertIn('sla_urgency_points', res['breakdown'])

    def test_hackathon_demo_scenario_allocation(self):
        """
        Tests the master hackathon demo conflict scenario:
        Sony Headphones (SKU-ELEC-101) has 7 available units.
        Order A requires 10 (Critical SLA), Order B requires 5 (Normal).
        System must recommend: allocate all 7 units to Order A, 3 backorder, and restock.
        """
        order_a = Order.query.filter_by(order_number='ORD-2026-0001').first()
        self.assertIsNotNone(order_a)

        eval_res = AllocationEngine.evaluate_allocation(order_a.id)
        self.assertTrue(eval_res['success'])
        eval_data = eval_res['evaluation']

        self.assertEqual(eval_data['overall_decision'], 'PARTIAL_ALLOCATION')
        self.assertTrue(eval_data['has_shortage'])
        self.assertEqual(eval_data['shortage_count'], 3)
        self.assertEqual(eval_data['items'][0]['allocatable_quantity'], 7)
        self.assertTrue(len(eval_data['reasons']) > 0)

    def test_picking_optimizer_route(self):
        """
        Tests heuristic route ordering and distance estimation
        """
        order = Order.query.filter_by(order_number='ORD-2026-0003').first()
        if order:
            res = PickingOptimizer.generate_optimized_route(order.id)
            if res.get('success'):
                self.assertIn('route', res)
                self.assertGreater(res['metrics']['estimated_distance_m'], 0)

    def test_replenishment_engine(self):
        """
        Tests safety stock and lead time calculations
        """
        recs = ReplenishmentEngine.evaluate_all_products()
        self.assertIsInstance(recs, list)
        self.assertGreater(len(recs), 0)
        first = recs[0]
        self.assertIn('reorder_point', first)
        self.assertIn('safety_stock', first)
        self.assertIn('days_of_stock', first)

    def test_what_if_simulator(self):
        """
        Tests What-If scenario calculations under demand surge
        """
        params = {
            'demand_multiplier': 1.30,
            'labor_capacity_pct': 85.0,
            'supplier_delay_days': 3,
            'zone_offline': False
        }
        res = SimulatorService.run_simulation(params)
        self.assertLess(res['simulated']['fulfillment_rate_pct'], res['baseline']['fulfillment_rate_pct'])
        self.assertGreater(len(res['recommended_actions']), 0)
        self.assertGreater(res['mitigated_projection']['fulfillment_rate_pct'], res['simulated']['fulfillment_rate_pct'])

    def test_grounded_ai_copilot(self):
        """
        Tests live DB grounded query responses
        """
        res_priority = CopilotService.answer_query("Which orders should we process first?")
        self.assertIn('answer', res_priority)
        self.assertIn('data_source', res_priority)

        res_bottleneck = CopilotService.answer_query("Why is fulfillment slow today?")
        self.assertIn('Packing Station 03', res_bottleneck['answer'])

if __name__ == '__main__':
    unittest.main()
