import unittest
import datetime
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestHostelVisitorAPI(unittest.TestCase):

    def test_01_root_status(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Smart Hostel Visitor Management System", response.text)

    def test_02_public_students_list(self):
        response = client.get("/students/public")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 2)
        s1 = next(s for s in data if s["full_name"] == "Aarav Sharma")
        s2 = next(s for s in data if s["full_name"] == "Ananya Verma")
        self.assertTrue(s1["is_available"])
        self.assertFalse(s2["is_available"])

    def test_03_login_student(self):
        response = client.post("/auth/login", json={
            "email": "student1@hostel.com",
            "password": "password123"
        })
        self.assertEqual(response.status_code, 200)
        token = response.json()["access_token"]
        self.assertIsNotNone(token)

    def test_04_create_visitor_request_invalid_govid(self):
        payload = {
            "visitor": {
                "full_name": "Test Visitor",
                "phone": "9998887770",
                "gov_id_type": "AADHAAR",
                "gov_id_number": "123"  # Invalid
            },
            "student_id": 1,
            "purpose": "Test visit"
        }
        response = client.post("/visitors/requests", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_05_create_visitor_request_unavailable_student(self):
        payload = {
            "visitor": {
                "full_name": "New Visitor",
                "phone": "9871112233",
                "gov_id_type": "PAN",
                "gov_id_number": "XYZPQ9876K"
            },
            "student_id": 2,  # Student 2 is unavailable
            "purpose": "Test visit"
        }
        response = client.post("/visitors/requests", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("UNAVAILABLE", response.json()["detail"])

    def test_06_full_happy_path_request_approve_checkin_checkout(self):
        # 1. Login Student 1
        login_res = client.post("/auth/login", json={
            "email": "student1@hostel.com",
            "password": "password123"
        })
        student_token = login_res.json()["access_token"]
        headers_student = {"Authorization": f"Bearer {student_token}"}

        # 2. Login Security Guard
        sec_res = client.post("/auth/login", json={
            "email": "security@hostel.com",
            "password": "password123"
        })
        security_token = sec_res.json()["access_token"]
        headers_security = {"Authorization": f"Bearer {security_token}"}

        # 3. Create Public Visitor Request for Student 1
        payload = {
            "visitor": {
                "full_name": "Happy Path Visitor",
                "phone": "9000011111",
                "gov_id_type": "AADHAAR",
                "gov_id_number": "999988887777"
            },
            "student_id": 1,
            "purpose": "Study session"
        }
        req_res = client.post("/visitors/requests", json=payload)
        self.assertEqual(req_res.status_code, 201)
        req_data = req_res.json()
        req_id = req_data["id"]
        self.assertEqual(req_data["status"], "PENDING")

        # 4. Student Approves Request
        app_res = client.patch(f"/requests/{req_id}/approve", headers=headers_student)
        self.assertEqual(app_res.status_code, 200)
        pass_code = app_res.json()["pass_code"]
        self.assertIsNotNone(pass_code)

        # 5. Security Lookups Pass Code
        lookup_res = client.get(f"/security/lookup/{pass_code}", headers=headers_security)
        self.assertEqual(lookup_res.status_code, 200)
        self.assertTrue(lookup_res.json()["can_checkin"])

        # 6. Security Performs Check-In with physical ID verification & note
        checkin_res = client.post("/security/checkin", headers=headers_security, json={
            "pass_code": pass_code,
            "gov_id_verified": True,
            "override_note": "Physical Aadhaar verified at Gate 1"
        })
        self.assertEqual(checkin_res.status_code, 200)
        self.assertEqual(checkin_res.json()["security_note"], "Physical Aadhaar verified at Gate 1")

        # 7. Test Double Check-In Prevention (409 Conflict)
        dup_res = client.post("/security/checkin", headers=headers_security, json={
            "pass_code": pass_code
        })
        self.assertEqual(dup_res.status_code, 409)

        # 8. Security Performs Check-Out
        checkout_res = client.post("/security/checkout", headers=headers_security, json={
            "pass_code": pass_code
        })
        self.assertEqual(checkout_res.status_code, 200)
        self.assertIsNotNone(checkout_res.json()["check_out_time"])

    def test_07_admin_active_and_overstay_endpoints(self):
        admin_res = client.post("/auth/login", json={
            "email": "admin@hostel.com",
            "password": "password123"
        })
        admin_token = admin_res.json()["access_token"]
        headers_admin = {"Authorization": f"Bearer {admin_token}"}

        act_res = client.get("/admin/active", headers=headers_admin)
        self.assertEqual(act_res.status_code, 200)

        ovr_res = client.get("/admin/overstays", headers=headers_admin)
        self.assertEqual(ovr_res.status_code, 200)
        overstays_data = ovr_res.json()
        self.assertGreaterEqual(len(overstays_data), 1)

    def test_08_student_registration_and_admin_approval_flow(self):
        # 1. Register new student
        unique_email = f"karan_{int(datetime.datetime.utcnow().timestamp())}@hostel.com"
        reg_payload = {
            "full_name": "Karan Malhotra",
            "email": unique_email,
            "password": "password123",
            "phone": "9876543333",
            "room_no": "304-D",
            "hostel_block": "Block D"
        }
        reg_res = client.post("/auth/register-student", json=reg_payload)
        self.assertEqual(reg_res.status_code, 201)
        student_data = reg_res.json()
        student_id = student_data["id"]
        self.assertFalse(student_data["is_approved"])

        # 2. Login attempt by unapproved student -> HTTP 403 Forbidden
        login_res = client.post("/auth/login", json={
            "email": unique_email,
            "password": "password123"
        })
        self.assertEqual(login_res.status_code, 403)
        self.assertIn("pending warden approval", login_res.json()["detail"].lower())

        # 3. Admin fetches pending student registrations
        admin_res = client.post("/auth/login", json={
            "email": "admin@hostel.com",
            "password": "password123"
        })
        admin_token = admin_res.json()["access_token"]
        headers_admin = {"Authorization": f"Bearer {admin_token}"}

        pending_res = client.get("/admin/pending-students", headers=headers_admin)
        self.assertEqual(pending_res.status_code, 200)
        pending_list = pending_res.json()
        self.assertTrue(any(s["id"] == student_id for s in pending_list))

        # 4. Admin approves student account
        app_res = client.patch(f"/admin/approve-student/{student_id}?action=approve", headers=headers_admin)
        self.assertEqual(app_res.status_code, 200)
        self.assertTrue(app_res.json()["is_approved"])

        # 5. Student logs in post-approval -> HTTP 200 OK
        ok_login = client.post("/auth/login", json={
            "email": unique_email,
            "password": "password123"
        })
        self.assertEqual(ok_login.status_code, 200)
        self.assertIsNotNone(ok_login.json()["access_token"])

    def test_09_overstay_notification_trigger(self):
        admin_res = client.post("/auth/login", json={
            "email": "admin@hostel.com",
            "password": "password123"
        })
        admin_token = admin_res.json()["access_token"]
        headers_admin = {"Authorization": f"Bearer {admin_token}"}

        # Trigger notification for seeded PASS03 overstay request (Request ID 3)
        notif_res = client.post("/notifications/trigger-overstay/3", headers=headers_admin)
        self.assertEqual(notif_res.status_code, 200)
        self.assertIn("OVERSTAY ALERT", notif_res.json()["title"])

    def test_10_period_reports(self):
        admin_res = client.post("/auth/login", json={
            "email": "admin@hostel.com",
            "password": "password123"
        })
        admin_token = admin_res.json()["access_token"]
        headers_admin = {"Authorization": f"Bearer {admin_token}"}

        report_res = client.get("/admin/reports?period=monthly", headers=headers_admin)
        self.assertEqual(report_res.status_code, 200)
    def test_11_visitor_track_pass_lookup(self):
        # Successful lookup for seeded visitor Priya Nair (9812345678)
        res_ok = client.post("/visitor/track-pass", json={
            "full_name": "Priya Nair",
            "phone": "9812345678"
        })
        self.assertEqual(res_ok.status_code, 200)
        data = res_ok.json()
        self.assertEqual(data["visitor_name"], "Priya Nair")
        self.assertIsNotNone(data["pass_code"])

        # 404 lookup for non-existent visitor
        res_404 = client.post("/visitor/track-pass", json={
            "full_name": "Unknown Person",
            "phone": "9999999999"
        })
        self.assertEqual(res_404.status_code, 404)
        self.assertIn("No visitor request found", res_404.json()["detail"])

if __name__ == "__main__":
    unittest.main()

