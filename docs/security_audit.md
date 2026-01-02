# Security Audit Report
**Date:** 2026-01-02
**Project:** CS308 Online Store
**Audited By:** Security Scan Tools (bandit, safety) + Manual Code Review

---

## Executive Summary

A comprehensive security audit was conducted on the CS308 Online Store codebase. The audit included:
- Automated security scanning using Bandit
- Dependency vulnerability checking using Safety
- Manual code review for SQL injection vulnerabilities
- Manual code review for XSS (Cross-Site Scripting) vulnerabilities

### Critical Findings
- **2 Critical vulnerabilities** found in dependencies (Django, sqlparse)
- **0 SQL injection vulnerabilities** found in application code
- **0 XSS vulnerabilities** found in application code
- **1 Medium-risk issue** in settings.py (hardcoded SECRET_KEY)

### Overall Security Rating: **GOOD** (after applying fixes)

---

## 1. Dependency Vulnerabilities (Safety Scan)

### 1.1 Django 5.2.8 - CRITICAL

**Status:** ✅ FIXED
**CVE IDs:** CVE-2025-64460, CVE-2025-13372
**Severity:** Critical

#### Vulnerability #1: XML Deserializer DoS
- **CVE:** CVE-2025-64460
- **Description:** Potential denial-of-service vulnerability in XML Deserializer
- **Affected Version:** Django 5.2.8
- **Fixed Version:** Django 5.2.9
- **Impact:** High - Can cause service disruption
- **Fix Applied:** Updated Django==5.2.8 → Django==5.2.9 in requirements.txt

#### Vulnerability #2: SQL Injection in FilteredRelation
- **CVE:** CVE-2025-13372
- **Description:** Potential SQL injection in FilteredRelation column aliases on PostgreSQL
- **Affected Version:** Django 5.2.8
- **Fixed Version:** Django 5.2.9
- **Impact:** Critical - Potential database compromise
- **Fix Applied:** Updated Django==5.2.8 → Django==5.2.9 in requirements.txt

### 1.2 sqlparse 0.5.3 - MEDIUM

**Status:** ✅ FIXED
**CVE ID:** None (Vulnerability ID: 82038)
**Severity:** Medium

- **Description:** Denial of Service (DoS) through Algorithmic Complexity. The SQL parser fails to enforce limits when processing deeply nested tuples and large token sequences.
- **Note:** This is an incomplete fix for CVE-2024-4340
- **Affected Version:** sqlparse 0.5.3
- **Fixed Version:** sqlparse 0.5.5
- **Impact:** Medium - Can cause performance degradation
- **Fix Applied:** Updated sqlparse==0.5.3 → sqlparse==0.5.5 in requirements.txt

---

## 2. Static Code Analysis (Bandit Scan)

### 2.1 High Priority Findings

#### Settings.py - Hardcoded SECRET_KEY
- **File:** `online_store/settings.py:24`
- **Severity:** LOW (but should be fixed for production)
- **Issue:** Django SECRET_KEY is hardcoded in settings file
- **Code:**
  ```python
  SECRET_KEY = "django-insecure-=$+ek2m6h7(g^s$$6xj@x1ayk1l9f4f*#dk^ei0896%e*+2kg@"
  ```
- **Recommendation:**
  - Move SECRET_KEY to environment variable
  - Use `django-environ` or `python-decouple`
  - Never commit production SECRET_KEY to version control

### 2.2 Low Priority Findings (Test Files Only)

The following issues were found in test files only and are **acceptable** for test environments:

#### Hardcoded Test Passwords
- **Files:** cart/tests.py, orders/tests.py, users/tests.py, test_*.py
- **Severity:** LOW
- **Issue:** Test files contain hardcoded passwords like 'TestPass123!' and 'password123'
- **Status:** ✅ ACCEPTABLE - These are test fixtures only

#### Missing Request Timeout
- **Files:** test_cart_api.py, test_filters.py
- **Severity:** MEDIUM
- **Issue:** requests.get() and requests.post() called without timeout parameter
- **Status:** ✅ ACCEPTABLE - These are test scripts only

#### Assert Statements
- **File:** test_category_api.py
- **Severity:** LOW
- **Issue:** Use of assert detected (removed when compiling to optimized bytecode)
- **Status:** ✅ ACCEPTABLE - These are test assertions

---

## 3. SQL Injection Review

### Methodology
- Searched for raw SQL queries: `.raw()`, `.execute()`, `cursor.`
- Reviewed all views and database interactions
- Checked query parameter handling

### Findings: ✅ NO VULNERABILITIES FOUND

#### Positive Security Practices Observed:

1. **Django ORM Usage**
   - All database queries use Django ORM
   - No raw SQL queries found in production code
   - Proper use of `.filter()`, `.get()`, `.create()` methods

2. **Query Parameter Handling** (products/views.py:44-66)
   ```python
   # Secure parameter handling
   category_id = self.request.query_params.get('category')
   if category_id:
       queryset = queryset.filter(category_id=category_id)
   ```
   - Uses parameterized queries through ORM
   - No string concatenation with user input

3. **DjangoFilterBackend Usage**
   - Uses DjangoFilterBackend for safe filtering
   - No manual SQL construction

4. **Transaction Safety** (orders/views.py:23-99)
   ```python
   @transaction.atomic
   def post(self, request):
       # Uses select_for_update() for race condition protection
       product = Product.objects.select_for_update().get(id=item.product.id)
   ```
   - Proper transaction management
   - Pessimistic locking to prevent race conditions

### Code Examples of Good Practices:

**users/views.py:36** - Safe user lookup:
```python
user = CustomUser.objects.get(email=email)
```

**products/views.py:45-59** - Safe filtering:
```python
if min_price:
    queryset = queryset.filter(price__gte=min_price)
if max_price:
    queryset = queryset.filter(price__lte=max_price)
```

---

## 4. XSS (Cross-Site Scripting) Review

### Methodology
- Reviewed response rendering
- Checked for `mark_safe()`, `|safe` template filter usage
- Analyzed serializer implementations
- Reviewed user input handling

### Findings: ✅ NO VULNERABILITIES FOUND

#### Positive Security Practices Observed:

1. **REST API Architecture**
   - Application is a REST API (not traditional web app)
   - Returns JSON responses only
   - No HTML rendering on backend
   - Frontend handles presentation (separate concern)

2. **Django REST Framework Serializers**
   - All data serialized through DRF serializers
   - Automatic JSON encoding
   - No manual HTML construction

3. **No Unsafe Template Operations**
   - No `mark_safe()` usage found
   - No `|safe` template filters found
   - No manual HTML construction

4. **Input Validation** (users/views.py:79-98)
   ```python
   username = request.data.get('username')
   email = request.data.get('email')

   # Strip whitespace
   username = username.strip()
   email = email.strip()
   ```
   - Input sanitization
   - Validation before processing

### Serializer Security (reviews/serializers.py):
```python
class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
```
- Read-only fields prevent injection
- Data automatically escaped during JSON serialization

---

## 5. Additional Security Observations

### Strengths

1. **Authentication & Authorization**
   - JWT-based authentication (djangorestframework-simplejwt)
   - Permission classes properly applied
   - Role-based access control implemented

2. **Password Security**
   - Uses Django's built-in password hashing
   - `check_password()` for secure comparison (users/views.py:39)
   - No plaintext password storage

3. **CORS Configuration**
   - django-cors-headers properly configured
   - Controlled cross-origin access

4. **Race Condition Protection** (orders/views.py:47-66)
   - Uses `select_for_update()` for pessimistic locking
   - Atomic transactions for order processing
   - Stock level checks before deduction

5. **Information Disclosure Prevention** (users/views.py:65-70)
   ```python
   except CustomUser.DoesNotExist:
       return Response(
           {'error': 'Invalid email or password'},
           status=status.HTTP_401_UNAUTHORIZED
       )
   ```
   - Generic error messages (prevents email enumeration)

6. **Payment Security** (orders/views.py:70-82)
   - Only stores last 4 digits of card number
   - No full card number storage
   - PCI DSS consideration

### Areas for Improvement

1. **SECRET_KEY Management**
   - **Priority:** HIGH
   - **Current:** Hardcoded in settings.py
   - **Recommendation:** Use environment variables
   - **Implementation:**
     ```python
     import os
     SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
     ```

2. **DEBUG Mode**
   - **Priority:** HIGH for production
   - **Recommendation:** Ensure DEBUG=False in production
   - **Add check:**
     ```python
     DEBUG = os.environ.get('DEBUG', 'False') == 'True'
     ```

3. **Rate Limiting**
   - **Priority:** MEDIUM
   - **Recommendation:** Add rate limiting to prevent brute force attacks
   - **Suggestion:** Use django-ratelimit or DRF throttling

4. **HTTPS Enforcement**
   - **Priority:** HIGH for production
   - **Recommendation:**
     ```python
     SECURE_SSL_REDIRECT = True
     SESSION_COOKIE_SECURE = True
     CSRF_COOKIE_SECURE = True
     ```

5. **Security Headers**
   - **Priority:** MEDIUM
   - **Recommendation:** Add django-csp or configure security headers
   - **Headers to add:**
     - X-Content-Type-Options
     - X-Frame-Options
     - Content-Security-Policy

---

## 6. Action Items

### Immediate Actions (Applied)
- [x] Update Django to 5.2.9
- [x] Update sqlparse to 0.5.5
- [x] Document security findings

### Recommended Actions (Not Yet Applied)
- [ ] Move SECRET_KEY to environment variable
- [ ] Ensure DEBUG=False in production deployment
- [ ] Add rate limiting to login/register endpoints
- [ ] Configure HTTPS enforcement for production
- [ ] Add security headers middleware
- [ ] Set up dependency scanning in CI/CD pipeline
- [ ] Schedule regular security audits

---

## 7. Testing Recommendations

1. **Penetration Testing**
   - Conduct external penetration test before production
   - Test authentication bypass attempts
   - Verify rate limiting effectiveness

2. **Security Testing in CI/CD**
   - Add bandit to CI pipeline
   - Add safety check to CI pipeline
   - Fail builds on critical vulnerabilities

3. **Regular Dependency Updates**
   - Run `safety check` weekly
   - Subscribe to Django security mailing list
   - Monitor CVE databases

---

## 8. Compliance Considerations

### GDPR / Data Protection
- User data collected: email, name, address, order history
- Recommendation: Add privacy policy and data deletion endpoints

### PCI DSS
- ✅ No full credit card numbers stored
- ✅ Only last 4 digits retained
- Recommendation: Use payment gateway (Stripe, PayPal) for actual processing

---

## 9. Conclusion

The CS308 Online Store application demonstrates **good security practices** overall:

- **Strong Foundation:** Uses Django ORM, DRF serializers, JWT authentication
- **No Critical Code Vulnerabilities:** No SQL injection or XSS found in application code
- **Dependency Issues Resolved:** All critical dependency vulnerabilities patched

### Security Score: 8.5/10

**Points deducted for:**
- Hardcoded SECRET_KEY (-0.5)
- Missing rate limiting (-0.5)
- No security headers middleware (-0.5)

### Next Steps
1. Apply recommended configuration changes for production
2. Set up automated security scanning in CI/CD
3. Schedule next security audit in 3 months

---

## 10. Appendix

### Tools Used
- **Bandit** 1.9.2 - Python security linter
- **Safety** 3.7.0 - Dependency vulnerability scanner
- **Manual Review** - Code inspection by security principles

### Files Reviewed
- All Python files in: cart/, orders/, products/, reviews/, users/
- Configuration: online_store/settings.py
- Dependencies: requirements.txt
- Total lines of code analyzed: 4,612 (per bandit metrics)

### Scan Date
- 2026-01-02

### Report Generated By
Automated security audit + Manual code review
