import unittest
from app import create_app
from app.config import Config

class TestApiEndpoints(unittest.TestCase):
    def setUp(self):
        self.app = create_app(Config)
        self.client = self.app.test_client()

    def test_health(self):
        resp = self.client.get('/api/health')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json['status'], 'healthy')

    def test_dashboard_endpoint(self):
        resp = self.client.get('/api/dashboard')
        self.assertEqual(resp.status_code, 200)
        data = resp.json
        self.assertIn('inventory_metrics', data)
        self.assertIn('order_metrics', data)
        self.assertIn('ai_recommendations', data)

    def test_orders_endpoint(self):
        resp = self.client.get('/api/orders')
        self.assertEqual(resp.status_code, 200)
        self.assertGreater(resp.json['count'], 0)

    def test_inventory_endpoint(self):
        resp = self.client.get('/api/inventory')
        self.assertEqual(resp.status_code, 200)
        self.assertGreater(resp.json['count'], 0)

    def test_allocation_recommend_endpoint(self):
        resp = self.client.get('/api/allocation/recommend/1')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('evaluation', resp.json)

    def test_exceptions_endpoint(self):
        resp = self.client.get('/api/exceptions')
        self.assertEqual(resp.status_code, 200)
        self.assertGreater(resp.json['count'], 0)

    def test_simulator_endpoint(self):
        resp = self.client.post('/api/simulator/run', json={'demand_multiplier': 1.25})
        self.assertEqual(resp.status_code, 200)
        self.assertIn('simulated', resp.json)

    def test_copilot_endpoint(self):
        resp = self.client.post('/api/copilot/query', json={'query': 'Which products are at stockout risk?'})
        self.assertEqual(resp.status_code, 200)
        self.assertIn('answer', resp.json)

if __name__ == '__main__':
    unittest.main()
