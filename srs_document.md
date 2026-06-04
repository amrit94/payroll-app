# Software Requirements Specification (SRS)

## Project: Payroll Management Application
**Version:** 3.0 (Decoupled Infrastructure Edition)  
**Date:** June 4, 2026  

---

## 1. Introduction

### 1.1 Purpose
This document details the functional, non-functional, and data infrastructure requirements for the Payroll Management Web Application. Built as a streamlined operations ledger, this system allows a single administrator to log daily attendance variables, configure dynamic per-employee baseline pay structures, record ad-hoc flat overtime milestones, track cash advances, and finalize immutable monthly payouts.

### 1.2 Product Scope
The target application delivers an alternative to complex, multi-tiered enterprise human resource applications. It addresses the overhead of traditional payroll workflows by providing a fast, touch-optimized mobile web layout for real-time tracking from a factory floor or job site. The scope is restricted explicitly to single-user administrative mechanics with zero employee-facing login surfaces.

---

## 2. General Description & Actors

### 2.1 User Classes and Characteristics
The application operates strictly under a single-user system blueprint. There are no secondary access layers, supervisory profiles, or dynamic user roles:
* **Super Administrator (Single Account):** Holds comprehensive authority across the application. Responsible for onboarding personnel metrics, inputting daily runtime hours, adjusting specific task flags, writing down financial loans or cash advances, exporting documents, and executing monthly cycle commitments.

### 2.2 Operating Environment
The system architecture utilizes a fully decoupled modern cloud paradigm. The frontend application interface is deployed independently on an edge network platform optimized for delivery, while the business domain application logic services execute inside an isolated compute instance.

---

## 3. System Features & Functional Requirements

### 3.1 Employee Registry & Parameter Customization
* **Requirement 3.1.1:** The administrative dashboard must provide an onboarding interface to register employees using unique identifiers (Full Name, Alpha-Numeric ID, Operational Status).
* **Requirement 3.1.2:** The platform must enforce an advanced, profile-specific base pay parameter configuration. The core engine must calculate payments using these explicit per-employee hourly rates rather than global company-wide baseline numbers.

### 3.2 Daily Attendance Ledger & Implicit State Tracking
* **Requirement 3.2.1:** The logging view must map current system time onto an intuitive calendar layout, queueing all active personnel for speed-optimized numeric entry.
* **Requirement 3.2.2 (Implicit Attendance Logic Pattern):**
    * *Positive Entry:* If hours are manually logged for an employee on a given date, the database explicitly updates their day's state to **Present**.
    * *Null Entry:* If the field is skipped, the system defaults their status to **Absent**, allocating an earned baseline parameter of exactly 0.00.
* **Requirement 3.2.3:** The core math architecture uses direct multipliers without regular shift constraints or legal standard capping. The standard equation executes as follows:
    
    $$\text{Daily Base Wage Earnings} = (\text{Manually Appended Hours}) \times (\text{Pre-configured Employee Base Rate})$$

### 3.3 Standardized Extra Work & Flat Tag Allocations
* **Requirement 3.3.1:** Every work log marked as Present can accept structural task extensions representing operational deliverables. Extensions apply direct flat currency bonuses to the daily gross total rather than computing variable hours multiplier metrics.
* **Requirement 3.3.2:** Each added item requires a specific description classification tag and an accompanying flat-rate currency value. The system processes this sum as a direct financial addition, bypassing dynamic multiplier formulas.
* **Requirement 3.3.3:** The tag field must utilize an interactive quick-selection interface populated with standard industry terms:

| Standard System Tag | Functional Assignment Scope | Calculation Metric Style |
| :--- | :--- | :--- |
| **Husk Packing** | Processing, bagging, and warehousing milling byproducts. | Flat Currency Input |
| **Rice delivery** | Outbound logistical dispatching, tracking, and transport load outs. | Flat Currency Input |
| **Paddy** | Raw materials procurement, grain intake, and offloading. | Flat Currency Input |
| *Custom Tag Option* | Dynamic on-the-fly interactive user definition for unlisted tasks. | Flat Currency Input |

### 3.4 Financial Advance Tracking Ledger
* **Requirement 3.4.1:** The backend core must implement a transactional debit logging profile tracking cash loans or payroll advances issued during an active cycle.
* **Requirement 3.4.2:** Accumulated monthly debits must save persistently and function as an immediate negative deduction modifier when calculating the net payout balance.

### 3.5 Monthly Compensation Aggregation & Hard-Lock Core
* **Requirement 3.5.1:** Processing configurations compile data sets natively on calendar-month schedules.
* **Requirement 3.5.2:** The primary financial processing pipeline compiles employee distributions via the structural calculation:

$$\text{Net Monthly Payout} = \sum(\text{Daily Base Wage Earnings}) + \sum(\text{Extra Work Flat Amounts}) - \sum(\text{Issued Cash Advances})$$

* **Requirement 3.5.3 (Immutable Hard Lock Action):** The calculation summary pane must show a clear confirmation control to process payroll. Executing this transaction must trigger a system-wide state change in the database. All daily entries, historical hour structures, advance balances, and tags tracking within that completed cycle must instantly switch to a read-only state. This prevents subsequent edits or structural data tampering.

### 3.6 Dual Reporting Engine & Export Specifications
* **Requirement 3.6.1:** The system requires an exporting subsystem to generate downloadable office documentation without external service steps.
* **Requirement 3.6.2 (Excel Sheet Compilation - .xlsx):** Builds dynamic matrices containing explicit structural headers: `[Employee ID, Full Name, Aggregate Hours, Base Pay Subtotal, Aggregated Extra Work, Advance Reductions, Net Cash Payout]`.
* **Requirement 3.6.3 (PDF Document Generation - .pdf):** Generates clean print-ready files containing formal accounting registers and breakdown vouchers formatted for small-screen visibility or distribution.

---

## 4. Software Technology & Infrastructure Stack Specification

### 4.1 Frontend Architecture Layer (Vercel Edge Cloud)
The interface user layer is developed utilizing React 18+ paired with the Vite build setup. This layer compiles into completely static assets (HTML, JS, CSS) deployed onto the Vercel Hobby/Free Tier Platform. This layout isolates the visual system, enabling global edge delivery and rapid code deployments triggered directly from version control systems (GitHub repository linkage). UI elements incorporate Tailwind CSS utility properties to enforce oversized touch targets (minimum 44x44 pixels) tailored for error-free administrative entries on mobile devices.

### 4.2 Backend Application Logic Layer (AWS EC2 Instance)
The runtime processing logic, data aggregation algorithms, and transactional calculations execute completely on Python 3.11+ running the FastAPI framework. This application tier is hosted inside an isolated Amazon Web Services (AWS) EC2 cloud compute instance (`t2.micro`/`t3.micro` running Ubuntu Server), satisfying the criteria for the AWS Free Tier framework. The backend process is bound behind a dedicated domain target or static Elastic IP configuration to accept API operations.

### 4.3 Cloud Database Tier (Supabase Postgres)
System transaction records, personnel data nodes, and cycle tracking sheets are isolated from the application host tier, executing directly within a remote relational PostgreSQL container managed via the Supabase Free Tier Environment. The backend FastAPI application on the EC2 host bridges data transactions using an encrypted relational database wrapper connection string.

### 4.4 Decoupled Communications & Network Configurations
Because the system frontend and backend platforms operate on separate domain systems, the deployment setup requires three explicit security and data handling rules:

1.  **Cross-Origin Resource Sharing (CORS) Middleware:** The FastAPI application code must instantiate a strict CORS authorization matrix. It must explicitly white-list the authenticated Vercel origin URL string to prevent mobile web browsers from intercepting or dropping payroll API payloads.
2.  **Dynamic Environment Key Configurations:** The React client build must resolve endpoints at compile time using a Vercel-configured application variable (e.g., `VITE_API_BASE_URL`). This parameter passes the public IP or secure domain address mapping to the active AWS EC2 host.
3.  **End-to-End SSL Enforcements (HTTPS):** Vercel manages edge routing certificates natively. To prevent browser errors due to 'Mixed Content Logging' safety rules, the EC2 server gateway must run a background certification utility (Certbot / Let's Encrypt) to encrypt FastAPI traffic natively via HTTPS on Port 443.

---

```
                  [ Your Mobile Phone Browser ]
                    /                       \
                   /                         \
  (Loads the UI Interface)              (Sends Payroll Data / API Requests)
                 /                             \
                ▼                               ▼
       ┌────────────────┐             ┌────────────────────────────────┐
       │     VERCEL     │             │          AWS EC2 SERVER        │
       │                │             │                                │
       │ React+Vite App │             │        FastAPI Backend         │
       └────────────────┘             └───────────────┬────────────────┘
                                                      │
                                                      │ (Secure Connection)
                                                      ▼
                                              ┌────────────────┐
                                              │ SUPABASE CLOUD │
                                              │ (Free Postgres)│
                                              └────────────────┘
```
