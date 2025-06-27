# 🧪 MITTWALD MCP FUNCTIONAL TESTING SWARM PLAN

Building on our successful 100% API integration, we now need comprehensive functional testing with UI validation. This plan coordinates the same 14 agents to test every tool with Puppeteer-based proof screenshots using **optimized parallel execution**.

## 📋 **SWARM TESTING COORDINATION STRATEGY**

### **Phase 1: Environment Setup (All Agents)**
Each agent must first prepare their **isolated testing environment using git worktrees**:

```bash
# 1. Create isolated worktree for testing (from main repo directory)
cd /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio
git worktree add ../test-{domain-name} feat/integrate-all-apis

# 2. Switch to your isolated worktree
cd ../test-{domain-name}

# 3. Create and push testing branch
git checkout -b test/functional-{domain-name}
git push -u origin test/functional-{domain-name}

# 4. Install dependencies and build in isolation
npm install
npm run build

# 5. Create screenshot directories in your worktree
mkdir -p test-results/screenshots/{domain-name}
mkdir -p test-results/reports/{domain-name}

# 6. Set up shared coordination directory (symlink to main repo)
ln -s /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio/test-coordination ./coordination
```

**🗂️ Worktree Directory Structure:**
```
/Users/robert/Code/Mittwald/
├── mittwald-typescript-mcp-systempromptio/          # Main repo
│   └── test-coordination/                           # Shared coordination files
│       ├── wave-status.txt
│       ├── project-assignments.txt
│       └── consolidated-screenshots/                # Centralized screenshots
├── test-user/                                       # Agent-1 worktree
├── test-notification/                               # Agent-10 worktree  
├── test-conversation/                               # Agent-11 worktree
├── test-customer/                                   # Agent-12 worktree
├── test-project/                                    # Agent-2 worktree
├── test-domain/                                     # Agent-3 worktree
├── test-filesystem/                                 # Agent-7 worktree
├── test-file/                                       # Agent-8 worktree
├── test-database/                                   # Agent-4 worktree
├── test-mail/                                       # Agent-5 worktree
├── test-ssh-backup/                                 # Agent-6 worktree
├── test-cronjob/                                    # Agent-9 worktree
├── test-marketplace/                                # Agent-13 worktree
└── test-app/                                        # Agent-14 worktree
```

### **Phase 2: Optimized Parallel Testing Waves**

**🚀 PARALLEL EXECUTION STRATEGY:**

Based on resource dependency analysis, we can run **4 parallel waves** instead of sequential testing:

#### **🌊 WAVE 1: Account-Level APIs (Parallel)**
**Duration: 30 minutes | 4 agents in parallel**
*These APIs only need account access, no project resource conflicts*

| Agent | Domain | Resources | Start Time |
|-------|--------|-----------|------------|
| **Agent-1** | User API | Account only | T+0min |
| **Agent-10** | Notification API | Account only | T+0min |
| **Agent-11** | Conversation API | Account only | T+0min |
| **Agent-12** | Customer API | Account only | T+0min |

#### **🌊 WAVE 2: Project Setup + Light Resource APIs (Parallel)**
**Duration: 45 minutes | 4 agents in parallel**
*Project creation + read-heavy operations that can share resources*

| Agent | Domain | Resources | Start Time |
|-------|--------|-----------|------------|
| **Agent-2** | Project API | Creates test projects | T+30min |
| **Agent-3** | Domain API | Light project usage | T+30min |
| **Agent-7** | Filesystem API | Read-only file operations | T+30min |
| **Agent-8** | File API | File upload/download ops | T+30min |

#### **🌊 WAVE 3: Heavy Project Resource APIs (Parallel with Dedicated Projects)**
**Duration: 60 minutes | 5 agents in parallel**
*Each agent uses a separate project created by Agent-2*

| Agent | Domain | Resources | Project Assignment | Start Time |
|-------|--------|-----------|-------------------|------------|
| **Agent-4** | Database API | Dedicated Project #1 | test-project-db | T+75min |
| **Agent-5** | Mail API | Dedicated Project #2 | test-project-mail | T+75min |
| **Agent-6** | SSH/Backup API | Dedicated Project #3 | test-project-ssh | T+75min |
| **Agent-9** | Cronjob API | Dedicated Project #4 | test-project-cron | T+75min |
| **Agent-13** | Marketplace API | Dedicated Project #5 | test-project-market | T+75min |

#### **🌊 WAVE 4: Critical App Installation (Isolated)**
**Duration: 90 minutes | 1 agent alone**
*Requires clean, dedicated environment for app installation*

| Agent | Domain | Resources | Start Time |
|-------|--------|-----------|------------|
| **Agent-14** | App API | **Clean dedicated project** | T+135min |

**📊 TOTAL TEST DURATION: 225 minutes (3h 45min) vs previous 310 minutes (5h 10min)**
**⚡ EFFICIENCY GAIN: 85 minutes saved (27% faster)**

## 🎯 **AGENT-SPECIFIC TESTING INSTRUCTIONS**

### **🌊 WAVE 1 AGENTS (T+0min - T+30min)**

#### **Agent-1: User API Testing** 
**Domain:** User authentication, profile, sessions, API tokens
**Test Duration:** 30 minutes | **Parallel with Wave 1**
**Screenshot Requirements:** 8 proof screenshots

```bash
# Testing sequence - Account-level operations only
1. mittwald_user_authenticate - Login flow screenshot
2. mittwald_user_get_profile - Profile page screenshot  
3. mittwald_user_get_email - Email settings screenshot
4. mittwald_user_list_sessions - Active sessions screenshot
5. mittwald_user_list_api_tokens - API tokens list screenshot
6. mittwald_user_create_api_token - New token creation screenshot
7. mittwald_user_change_password - Password change confirmation screenshot
8. mittwald_user_get_mfa_status - MFA status screenshot
```

#### **Agent-10: Notification API Testing**
**Domain:** Notifications, unread counts, mark as read
**Test Duration:** 20 minutes | **Parallel with Wave 1**
**Screenshot Requirements:** 4 proof screenshots

```bash
# Testing sequence - Account-level notifications
1. mittwald_notification_list - Notifications list screenshot
2. mittwald_notification_unread_counts - Unread counts screenshot
3. mittwald_notification_mark_read - Mark read screenshot
4. mittwald_notification_mark_all_read - Mark all read screenshot
```

#### **Agent-11: Conversation API Testing**
**Domain:** Support conversations, messages, file uploads
**Test Duration:** 30 minutes | **Parallel with Wave 1**
**Screenshot Requirements:** 8 proof screenshots

```bash
# Testing sequence - Support conversations
1. mittwald_conversation_list - Conversations list screenshot
2. mittwald_conversation_create - New conversation screenshot
3. mittwald_conversation_get - Conversation details screenshot
4. mittwald_conversation_message_list - Messages list screenshot
5. mittwald_conversation_message_create - New message screenshot
6. mittwald_conversation_file_upload - File upload screenshot
7. mittwald_conversation_status_set - Status change screenshot
8. mittwald_conversation_members_get - Members list screenshot
```

#### **Agent-12: Customer API Testing**
**Domain:** Customer information, billing, invoices
**Test Duration:** 30 minutes | **Parallel with Wave 1**
**Screenshot Requirements:** 6 proof screenshots

```bash
# Testing sequence - Account/billing info
1. mittwald_customer_get_info - Customer info screenshot
2. mittwald_customer_list_invoices - Invoices list screenshot
3. mittwald_customer_get_invoice - Invoice details screenshot
4. mittwald_customer_update_info - Info update screenshot
5. mittwald_customer_billing_settings - Billing settings screenshot
6. mittwald_customer_payment_methods - Payment methods screenshot
```

### **🌊 WAVE 2 AGENTS (T+30min - T+75min)**

#### **Agent-2: Project API Testing** ⭐ **PROJECT CREATOR**
**Domain:** Project management, memberships, invitations
**Test Duration:** 45 minutes | **Parallel with Wave 2**
**Screenshot Requirements:** 12 proof screenshots
**SPECIAL ROLE:** Create test projects for Wave 3 agents

```bash
# Testing sequence - ALSO creates projects for other agents
1. mittwald_project_list - Projects overview screenshot
2. mittwald_project_create - Create "test-project-db" screenshot
3. mittwald_project_create - Create "test-project-mail" screenshot
4. mittwald_project_create - Create "test-project-ssh" screenshot
5. mittwald_project_create - Create "test-project-cron" screenshot
6. mittwald_project_create - Create "test-project-market" screenshot
7. mittwald_project_get - Project details screenshot
8. mittwald_project_update_description - Description update screenshot
9. mittwald_project_membership_list - Members list screenshot
10. mittwald_project_invite_create - Invitation sent screenshot
11. mittwald_project_get_storage_statistics - Storage usage screenshot
12. mittwald_project_get_contract - Contract details screenshot

# CRITICAL: Share project IDs with Wave 3 agents via coordination directory
echo "test-project-db: [PROJECT_ID]" > ./coordination/project-assignments.txt
echo "test-project-mail: [PROJECT_ID]" >> ./coordination/project-assignments.txt
echo "test-project-ssh: [PROJECT_ID]" >> ./coordination/project-assignments.txt
echo "test-project-cron: [PROJECT_ID]" >> ./coordination/project-assignments.txt
echo "test-project-market: [PROJECT_ID]" >> ./coordination/project-assignments.txt
```

#### **Agent-3: Domain API Testing**
**Domain:** Domain management, DNS, nameservers
**Test Duration:** 45 minutes | **Parallel with Wave 2**
**Screenshot Requirements:** 10 proof screenshots

```bash
# Testing sequence - Light project resource usage
1. mittwald_domain_list - Domains overview screenshot
2. mittwald_domain_get - Domain details screenshot
3. mittwald_domain_check_registrability - Domain check screenshot
4. mittwald_domain_update_nameservers - DNS settings screenshot
5. mittwald_domain_create_auth_code - Auth code generation screenshot
6. mittwald_domain_update_contact - Contact update screenshot
7. mittwald_domain_get_supported_tlds - TLD list screenshot
8. mittwald_domain_get_contract - Domain contract screenshot
9. mittwald_domain_update_project - Project assignment screenshot
10. mittwald_domain_abort_declaration - Abort operation screenshot
```

#### **Agent-7: Filesystem API Testing**
**Domain:** Directory listing, disk usage, file content
**Test Duration:** 30 minutes | **Parallel with Wave 2**
**Screenshot Requirements:** 5 proof screenshots

```bash
# Testing sequence - Read-only operations, can share project
1. mittwald_filesystem_list_directories - File browser screenshot
2. mittwald_filesystem_get_disk_usage - Disk usage screenshot
3. mittwald_filesystem_get_file_content - File content screenshot
4. mittwald_filesystem_list_files - Files list screenshot
5. mittwald_filesystem_get_jwt - JWT token screenshot
```

#### **Agent-8: File API Testing**
**Domain:** File uploads, downloads, meta information
**Test Duration:** 30 minutes | **Parallel with Wave 2**
**Screenshot Requirements:** 8 proof screenshots

```bash
# Testing sequence - File operations, can share project
1. mittwald_file_create - File upload screenshot
2. mittwald_file_get_meta - File metadata screenshot
3. mittwald_file_get - File download screenshot
4. mittwald_file_get_upload_rules - Upload rules screenshot
5. mittwald_conversation_file_upload - Conversation file screenshot
6. mittwald_invoice_file_access - Invoice file screenshot
7. mittwald_file_get_upload_token_rules - Token rules screenshot
8. mittwald_file_get_upload_type_rules - Type rules screenshot
```

### **🌊 WAVE 3 AGENTS (T+75min - T+135min)**

#### **Agent-4: Database API Testing**
**Domain:** MySQL and Redis database management
**Test Duration:** 60 minutes | **Parallel with Wave 3**
**Screenshot Requirements:** 15 proof screenshots
**Project:** test-project-db

```bash
# Get assigned project ID from coordination directory
PROJECT_ID=$(grep "test-project-db:" ./coordination/project-assignments.txt | cut -d' ' -f2)

# Testing sequence - Dedicated database project
1. mittwald_mysql_database_list - MySQL databases screenshot
2. mittwald_mysql_database_create - New database creation screenshot
3. mittwald_mysql_database_get - Database details screenshot
4. mittwald_mysql_database_update_description - Database description screenshot
5. mittwald_mysql_user_list - Database users screenshot
6. mittwald_mysql_user_create - New user creation screenshot
7. mittwald_mysql_user_get - User details screenshot
8. mittwald_mysql_user_update_password - Password update screenshot
9. mittwald_redis_database_list - Redis databases screenshot
10. mittwald_redis_database_create - New Redis database screenshot
11. mittwald_redis_database_get - Redis details screenshot
12. mittwald_redis_get_versions - Redis versions screenshot
13. mittwald_app_database_link - Database linking screenshot
14. mittwald_mysql_user_get_phpmyadmin_url - PhpMyAdmin URL screenshot
15. mittwald_mysql_database_delete - Database cleanup screenshot
```

#### **Agent-5: Mail API Testing**
**Domain:** Email addresses, delivery boxes, mail settings
**Test Duration:** 45 minutes | **Parallel with Wave 3**
**Screenshot Requirements:** 12 proof screenshots
**Project:** test-project-mail

```bash
# Get assigned project ID from coordination directory
PROJECT_ID=$(grep "test-project-mail:" ./coordination/project-assignments.txt | cut -d' ' -f2)

# Testing sequence - Dedicated mail project
1. mittwald_mail_list_addresses - Mail addresses list screenshot
2. mittwald_mail_create_address - New email creation screenshot
3. mittwald_mail_get_address - Email details screenshot
4. mittwald_mail_update_password - Password update screenshot
5. mittwald_mail_update_quota - Quota update screenshot
6. mittwald_mail_update_forward_addresses - Forwarding screenshot
7. mittwald_mail_list_delivery_boxes - Delivery boxes screenshot
8. mittwald_mail_create_delivery_box - New delivery box screenshot
9. mittwald_mail_get_delivery_box - Delivery box details screenshot
10. mittwald_mail_list_project_settings - Mail settings screenshot
11. mittwald_mail_update_project_setting - Settings update screenshot
12. mittwald_mail_delete_address - Email cleanup screenshot
```

#### **Agent-6: SSH/Backup API Testing**
**Domain:** SSH keys, SSH users, SFTP users, backups, schedules
**Test Duration:** 60 minutes | **Parallel with Wave 3**
**Screenshot Requirements:** 24 proof screenshots
**Project:** test-project-ssh

```bash
# Get assigned project ID from coordination directory
PROJECT_ID=$(grep "test-project-ssh:" ./coordination/project-assignments.txt | cut -d' ' -f2)

# Testing sequence - Dedicated SSH/backup project
1. mittwald_list_ssh_keys - SSH keys list screenshot
2. mittwald_create_ssh_key - New SSH key creation screenshot
3. mittwald_get_ssh_key - SSH key details screenshot
4. mittwald_update_ssh_key - SSH key update screenshot
5. mittwald_list_ssh_users - SSH users list screenshot
6. mittwald_create_ssh_user - New SSH user creation screenshot
7. mittwald_get_ssh_user - SSH user details screenshot
8. mittwald_update_ssh_user - SSH user update screenshot
9. mittwald_list_sftp_users - SFTP users list screenshot
10. mittwald_create_sftp_user - New SFTP user creation screenshot
11. mittwald_get_sftp_user - SFTP user details screenshot
12. mittwald_update_sftp_user - SFTP user update screenshot
13. mittwald_list_backups - Backups list screenshot
14. mittwald_create_backup - Backup creation screenshot
15. mittwald_get_backup - Backup details screenshot
16. mittwald_update_backup_description - Backup description screenshot
17. mittwald_create_backup_export - Backup export screenshot
18. mittwald_list_backup_schedules - Backup schedules screenshot
19. mittwald_create_backup_schedule - New schedule creation screenshot
20. mittwald_get_backup_schedule - Schedule details screenshot
21. mittwald_update_backup_schedule - Schedule update screenshot
22. mittwald_delete_backup_export - Export cleanup screenshot
23. mittwald_delete_backup_schedule - Schedule cleanup screenshot
24. mittwald_delete_ssh_key - SSH key cleanup screenshot
```

#### **Agent-9: Cronjob API Testing**
**Domain:** Scheduled tasks, executions, triggers
**Test Duration:** 45 minutes | **Parallel with Wave 3**
**Screenshot Requirements:** 9 proof screenshots
**Project:** test-project-cron

```bash
# Get assigned project ID from coordination directory
PROJECT_ID=$(grep "test-project-cron:" ./coordination/project-assignments.txt | cut -d' ' -f2)

# Testing sequence - Dedicated cronjob project
1. mittwald_cronjob_list - Cronjobs list screenshot
2. mittwald_cronjob_create - New cronjob creation screenshot
3. mittwald_cronjob_get - Cronjob details screenshot
4. mittwald_cronjob_update - Cronjob update screenshot
5. mittwald_cronjob_trigger - Manual trigger screenshot
6. mittwald_cronjob_list_executions - Executions list screenshot
7. mittwald_cronjob_get_execution - Execution details screenshot
8. mittwald_cronjob_abort_execution - Abort execution screenshot
9. mittwald_cronjob_delete - Cronjob cleanup screenshot
```

#### **Agent-13: Marketplace API Testing** 
**Domain:** Extensions, contributions, instances
**Test Duration:** 45 minutes | **Parallel with Wave 3**
**Screenshot Requirements:** 15 proof screenshots
**Project:** test-project-market

```bash
# Get assigned project ID from coordination directory
PROJECT_ID=$(grep "test-project-market:" ./coordination/project-assignments.txt | cut -d' ' -f2)

# Testing sequence - Dedicated marketplace project
1. mittwald_extension_list - Extensions list screenshot
2. mittwald_extension_get - Extension details screenshot
3. mittwald_extension_create - New extension screenshot
4. mittwald_extension_update - Extension update screenshot
5. mittwald_extension_instance_list - Instances list screenshot
6. mittwald_extension_instance_create - New instance screenshot
7. mittwald_extension_instance_get - Instance details screenshot
8. mittwald_extension_instance_enable - Instance enable screenshot
9. mittwald_contributor_list - Contributors list screenshot
10. mittwald_contributor_get - Contributor details screenshot
11. mittwald_marketplace_list_scopes - Scopes list screenshot
12. mittwald_marketplace_get_public_key - Public key screenshot
13. mittwald_extension_instance_disable - Instance disable screenshot
14. mittwald_extension_instance_delete - Instance cleanup screenshot
15. mittwald_extension_delete - Extension cleanup screenshot
```

### **🌊 WAVE 4 AGENT (T+135min - T+225min)**

#### **Agent-14: App API Testing** ⚠️ **CRITICAL FINAL WAVE**
**Domain:** Application installation, system software, updates
**Test Duration:** 90 minutes | **ISOLATED EXECUTION**
**Screenshot Requirements:** 16 proof screenshots
**Project:** **Clean dedicated project** (create fresh)

```bash
# Create dedicated clean project for app testing
PROJECT_ID=$(mittwald_project_create --description "Clean App Testing Project")

# Testing sequence - REQUIRES CLEAN PROJECT
1. mittwald_app_list - Available apps screenshot
2. mittwald_app_get - App details screenshot  
3. mittwald_app_list_versions - App versions screenshot
4. mittwald_app_installation_list - Current installations screenshot
5. mittwald_app_installation_create - **APP INSTALLATION START** screenshot
6. [WAIT 5-10 MINUTES] - Installation progress screenshots (3-4 screenshots)
7. mittwald_app_installation_get - Installation details screenshot
8. mittwald_app_installation_get_status - Installation status screenshot
9. mittwald_app_installation_action - App action (restart) screenshot
10. mittwald_app_installation_get_missing_dependencies - Dependencies screenshot
11. mittwald_system_software_list - System software screenshot
12. mittwald_system_software_get - Software details screenshot
13. mittwald_app_installation_get_system_software - App system software screenshot
14. mittwald_app_installation_copy - App copy screenshot
15. mittwald_app_installation_update - App update screenshot
16. mittwald_app_installation_delete - **APP DELETION** screenshot
```

## 📸 **SCREENSHOT NAMING & COORDINATION**

### **Local Screenshot Storage (In Your Worktree):**
```bash
# Save screenshots locally in your worktree first
test-results/screenshots/{domain-name}/{tool-name}_{timestamp}_{status}.png

Examples:
test-results/screenshots/user/mittwald_user_authenticate_20241227_143022_success.png
test-results/screenshots/project/mittwald_project_create_20241227_143125_success.png
test-results/screenshots/app/mittwald_app_installation_create_20241227_145430_success.png
```

### **Centralized Screenshot Coordination:**
```bash
# Copy successful screenshots to shared location after each test
cp test-results/screenshots/{domain-name}/*.png \
   ./coordination/consolidated-screenshots/{domain-name}/

# Update shared status with screenshot count
echo "Agent-{X} {domain}: {success_count} screenshots uploaded at $(date)" >> \
     ./coordination/wave-status.txt
```

## 📊 **WAVE COORDINATION & COMMUNICATION**

### **Pre-Wave Checklist (In Your Worktree):**
```bash
# Before starting your wave, confirm:
1. Check previous wave completion: cat ./coordination/wave-status.txt
2. Verify dependencies (e.g., projects created): cat ./coordination/project-assignments.txt
3. Confirm your worktree build: npm run build
4. Ensure coordination link works: ls -la ./coordination/

# Update shared status from your worktree
echo "Wave X Agent-Y: STARTED at $(date) from $(pwd)" >> ./coordination/wave-status.txt
```

### **Post-Wave Checklist (In Your Worktree):**
```bash
# After completing your wave:
1. Copy screenshots to shared location:
   mkdir -p ./coordination/consolidated-screenshots/{domain-name}
   cp test-results/screenshots/{domain-name}/*.png ./coordination/consolidated-screenshots/{domain-name}/

2. Copy your report to shared location:
   cp test-results/reports/{domain-name}_report.md ./coordination/reports/

3. Clean up test resources in Mittwald UI

4. Update wave completion status:
   echo "Wave X Agent-Y: COMPLETED at $(date) - {success_count}/{total_count} tests passed" >> ./coordination/wave-status.txt

5. Commit your test branch:
   git add test-results/
   git commit -m "test: {domain} API functional testing complete - {success_count}/{total_count} passed"
   git push origin test/functional-{domain-name}
```

## 📊 **FINAL TESTING REPORT TEMPLATE**

Each agent must create a final report:
```markdown
# {Domain} API Functional Testing Report

## Wave Information
- **Wave Number:** X
- **Parallel Agents:** Agent-X, Agent-Y, Agent-Z
- **Test Duration:** X minutes
- **Project Used:** {project-name} (if applicable)

## Summary
- **Total Tools Tested:** X/Y
- **Success Rate:** X%  
- **Screenshots Captured:** X
- **Critical Issues:** X

## Test Results
| Tool Name | Status | Screenshot | Response Time | Notes |
|-----------|--------|------------|---------------|-------|
| mittwald_tool_name | ✅ PASS | screenshot_link | 250ms | Working correctly |
| mittwald_tool_name | ❌ FAIL | screenshot_link | TIMEOUT | Error: description |

## Issues Found
- **Issue 1:** Description and screenshot evidence
- **Issue 2:** Description and screenshot evidence

## Performance Notes
- Average response time: Xms
- Slowest operation: tool_name (Xms)
- UI load times: Xs average

## Cleanup Actions Taken
- Test resources deleted: [list]
- Projects cleaned: [list]
- Test data removed: [list]
```

## 🚨 **CRITICAL COORDINATION RULES**

1. **RESPECT WAVE TIMING** - Do not start until your wave's scheduled time
2. **CHECK DEPENDENCIES** - Wave 3 agents must wait for Agent-2 to create projects
3. **RESOURCE ISOLATION** - Each Wave 3 agent uses their assigned project only
4. **COMMUNICATE STATUS** - Update wave-status.txt when starting/finishing
5. **APP TESTING PRIORITY** - Agent-14 gets completely clean environment
6. **SCREENSHOT PROOF** - Every successful operation needs visual proof
7. **ERROR DOCUMENTATION** - Screenshot and document all failures
8. **CLEANUP RESPONSIBILITY** - Clean your test data before finishing

## 📁 **CENTRALIZED RESULTS COORDINATION**

### **Main Coordination Hub:**
```
/Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio/test-coordination/
├── consolidated-screenshots/           # All screenshots copied here
│   ├── user/                          # From test-user/ worktree
│   ├── notification/                  # From test-notification/ worktree
│   ├── conversation/                  # From test-conversation/ worktree
│   ├── customer/                      # From test-customer/ worktree
│   ├── project/                       # From test-project/ worktree
│   ├── domain/                        # From test-domain/ worktree
│   ├── filesystem/                    # From test-filesystem/ worktree
│   ├── file/                          # From test-file/ worktree
│   ├── database/                      # From test-database/ worktree
│   ├── mail/                          # From test-mail/ worktree
│   ├── ssh-backup/                    # From test-ssh-backup/ worktree
│   ├── cronjob/                       # From test-cronjob/ worktree
│   ├── marketplace/                   # From test-marketplace/ worktree
│   └── app/                           # From test-app/ worktree
├── reports/                           # All reports copied here
│   └── {domain}_report.md             # From each worktree
├── wave-status.txt                    # Real-time coordination
├── project-assignments.txt            # Project sharing for Wave 3
└── consolidated-report.md             # Final summary (generated)
```

### **Individual Worktree Structure:**
```
/Users/robert/Code/Mittwald/test-{domain}/
├── test-results/                      # Local test results
│   ├── screenshots/{domain}/          # Local screenshots
│   └── reports/                       # Local reports
├── coordination/                      # Symlink to main test-coordination/
├── src/                              # Full codebase copy
├── node_modules/                     # Isolated dependencies
└── build/                            # Isolated build
```

### **Git Branch Structure:**
```
origin/feat/integrate-all-apis         # Source branch for all worktrees
origin/test/functional-user            # Agent-1 test results
origin/test/functional-notification    # Agent-10 test results
origin/test/functional-conversation    # Agent-11 test results
origin/test/functional-customer        # Agent-12 test results
origin/test/functional-project         # Agent-2 test results
origin/test/functional-domain          # Agent-3 test results
origin/test/functional-filesystem      # Agent-7 test results
origin/test/functional-file            # Agent-8 test results
origin/test/functional-database        # Agent-4 test results
origin/test/functional-mail            # Agent-5 test results
origin/test/functional-ssh-backup      # Agent-6 test results
origin/test/functional-cronjob         # Agent-9 test results
origin/test/functional-marketplace     # Agent-13 test results
origin/test/functional-app             # Agent-14 test results
```

---

**🎯 SUCCESS CRITERIA:** 
- All 82 Mittwald tools tested with UI validation
- Visual proof screenshots for every successful operation  
- Comprehensive error documentation for any failures
- Optimized parallel execution saving 27% time
- Clean environment maintained with proper resource isolation
- 100% functional verification of integrated MCP server

**⚡ EFFICIENCY GAINS:**
- **4 Parallel Waves** instead of 14 sequential agents
- **225 minutes total** vs 310 minutes sequential (85 minutes saved)
- **Resource optimization** with dedicated project assignments
- **Dependency management** with coordinated project creation
- **Risk mitigation** with isolated app installation testing

This coordinated parallel testing approach ensures thorough validation while maximizing efficiency and respecting resource constraints.