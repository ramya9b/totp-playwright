// Jenkins Pipeline for Playwright TOTP Tests
// Jenkinsfile (Declarative Pipeline)

pipeline {
    agent any
    
    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['staging', 'production'],
            description: 'Test Environment'
        )
        choice(
            name: 'BROWSER',
            choices: ['chromium', 'firefox', 'webkit', 'all'],
            description: 'Browser to test'
        )
        booleanParam(
            name: 'RUN_ALL_BROWSERS',
            defaultValue: false,
            description: 'Run tests on all browsers'
        )
        booleanParam(
            name: 'GENERATE_REPORTS',
            defaultValue: true,
            description: 'Generate test reports'
        )
    }
    
    environment {
        NODE_VERSION = '18'
        JAVA_HOME = tool name: 'JDK11', type: 'jdk'
        PATH = "${JAVA_HOME}/bin:${env.PATH}"
        CI = 'true'
        ALLURE_RESULTS_DIR = 'allure-results'
        ALLURE_REPORT_DIR = 'allure-report'
    }
    
    triggers {
        // Daily execution at 6 AM
        cron('0 6 * * *')
        // Poll SCM every 5 minutes for changes
        pollSCM('H/5 * * * *')
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10', daysToKeepStr: '30'))
        timeout(time: 45, unit: 'MINUTES')
        retry(1)
        skipStagesAfterUnstable()
        parallelsAlwaysFailFast()
    }
    
    stages {
        stage('Checkout & Setup') {
            steps {
                echo '📥 Checking out repository...'
                checkout scm
                
                echo '⚙️ Setting up Node.js environment...'
                script {
                    def nodeJS = tool name: 'NodeJS-18', type: 'nodejs'
                    env.PATH = "${nodeJS}/bin:${env.PATH}"
                }
                
                echo '📦 Installing dependencies...'
                sh '''
                    node --version
                    npm --version
                    npm ci
                    npm install -g allure-commandline
                '''
                
                echo '🔧 Installing Playwright browsers...'
                sh '''
                    if [ "${params.BROWSER}" = "all" ] || [ "${params.RUN_ALL_BROWSERS}" = "true" ]; then
                        npx playwright install --with-deps
                    else
                        npx playwright install --with-deps ${params.BROWSER}
                    fi
                '''
            }
        }
        
        stage('Environment Configuration') {
            steps {
                echo '🔐 Configuring test environment...'
                withCredentials([
                    string(credentialsId: 'D365_URL', variable: 'D365_URL'),
                    string(credentialsId: 'D365_EMAIL', variable: 'D365_EMAIL'),
                    string(credentialsId: 'D365_PASSWORD', variable: 'D365_PASSWORD'),
                    string(credentialsId: 'TOTP_SECRET', variable: 'TOTP_SECRET')
                ]) {
                    sh '''
                        echo "D365_URL=${D365_URL}" >> .env
                        echo "D365_EMAIL=${D365_EMAIL}" >> .env
                        echo "D365_PASSWORD=${D365_PASSWORD}" >> .env
                        echo "TOTP_SECRET=${TOTP_SECRET}" >> .env
                        echo "CI=true" >> .env
                        echo "ENVIRONMENT=${params.ENVIRONMENT}" >> .env
                    '''
                }
            }
        }
        
        stage('Test Execution') {
            parallel {
                stage('Chromium Tests') {
                    when {
                        anyOf {
                            expression { params.BROWSER == 'chromium' }
                            expression { params.BROWSER == 'all' }
                            expression { params.RUN_ALL_BROWSERS == true }
                        }
                    }
                    steps {
                        echo '🧪 Running Chromium tests...'
                        catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                            sh '''
                                export BROWSER=chromium
                                npm run test:all-reports
                                mv allure-results allure-results-chromium
                                mv playwright-report playwright-report-chromium
                                mv visual-report.html visual-report-chromium.html
                            '''
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'screenshots/**/*', allowEmptyArchive: true
                            archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                        }
                    }
                }
                
                stage('Firefox Tests') {
                    when {
                        anyOf {
                            expression { params.BROWSER == 'firefox' }
                            expression { params.BROWSER == 'all' }
                            expression { params.RUN_ALL_BROWSERS == true }
                        }
                    }
                    steps {
                        echo '🧪 Running Firefox tests...'
                        catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                            sh '''
                                export BROWSER=firefox
                                npm run test:all-reports
                                mv allure-results allure-results-firefox
                                mv playwright-report playwright-report-firefox
                                mv visual-report.html visual-report-firefox.html
                            '''
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'screenshots/**/*', allowEmptyArchive: true
                            archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                        }
                    }
                }
                
                stage('Safari Tests') {
                    when {
                        anyOf {
                            expression { params.BROWSER == 'webkit' }
                            expression { params.BROWSER == 'all' }
                            expression { params.RUN_ALL_BROWSERS == true }
                        }
                    }
                    steps {
                        echo '🧪 Running Safari tests...'
                        catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                            sh '''
                                export BROWSER=webkit
                                npm run test:all-reports
                                mv allure-results allure-results-webkit
                                mv playwright-report playwright-report-webkit
                                mv visual-report.html visual-report-webkit.html
                            '''
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'screenshots/**/*', allowEmptyArchive: true
                            archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                        }
                    }
                }
            }
        }
        
        stage('Report Generation') {
            when {
                expression { params.GENERATE_REPORTS == true }
            }
            steps {
                echo '📊 Generating comprehensive test reports...'
                sh '''
                    # Combine all Allure results
                    mkdir -p combined-allure-results
                    find . -name "allure-results-*" -type d -exec cp -r {}/* combined-allure-results/ \\; 2>/dev/null || true
                    
                    # Generate combined Allure report
                    if [ -d "combined-allure-results" ] && [ "$(ls -A combined-allure-results)" ]; then
                        allure generate combined-allure-results --clean -o ${ALLURE_REPORT_DIR}
                        echo "✅ Allure report generated successfully"
                    else
                        echo "⚠️ No Allure results found, skipping report generation"
                    fi
                    
                    # Create report index
                    cat > reports-index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>🎭 Playwright Test Reports</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 40px; }
        .report-links { display: grid; gap: 20px; }
        .report-card { padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
        .report-card a { text-decoration: none; color: #007bff; font-weight: bold; }
        .report-card:hover { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Playwright Test Reports</h1>
            <p>Build #${BUILD_NUMBER} - Environment: ${params.ENVIRONMENT}</p>
            <p>Browser: ${params.BROWSER} - Date: $(date)</p>
        </div>
        <div class="report-links">
            <div class="report-card">
                <h3>🌟 Allure Report</h3>
                <p>Comprehensive test analytics and results</p>
                <a href="allure-report/index.html" target="_blank">View Allure Report</a>
            </div>
            <div class="report-card">
                <h3>🏠 Playwright HTML Reports</h3>
                <p>Detailed test execution with traces</p>
                <a href="playwright-report-chromium/index.html" target="_blank">Chromium Report</a> |
                <a href="playwright-report-firefox/index.html" target="_blank">Firefox Report</a> |
                <a href="playwright-report-webkit/index.html" target="_blank">Safari Report</a>
            </div>
            <div class="report-card">
                <h3>📊 Custom Visual Reports</h3>
                <p>Interactive charts and visualizations</p>
                <a href="visual-report-chromium.html" target="_blank">Chromium Charts</a> |
                <a href="visual-report-firefox.html" target="_blank">Firefox Charts</a> |
                <a href="visual-report-webkit.html" target="_blank">Safari Charts</a>
            </div>
        </div>
    </div>
</body>
</html>
EOF
                '''
            }
            post {
                always {
                    // Publish HTML reports
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'reports-index.html',
                        reportName: '🎭 Test Reports Index'
                    ])
                    
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'allure-report',
                        reportFiles: 'index.html',
                        reportName: '🌟 Allure Report'
                    ])
                    
                    // Archive all reports
                    archiveArtifacts artifacts: 'allure-report/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'playwright-report-*/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'visual-report-*.html', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                    
                    // Publish test results
                    publishTestResults testResultsPattern: 'test-results/results.xml'
                }
            }
        }
        
        stage('Quality Gates') {
            steps {
                echo '🔍 Evaluating quality gates...'
                script {
                    def testResults = readFile('test-results/results.json')
                    def json = readJSON text: testResults
                    
                    def totalTests = json.stats.total
                    def passedTests = json.stats.passed
                    def failedTests = json.stats.failed
                    def passRate = (passedTests / totalTests) * 100
                    
                    echo "📊 Test Statistics:"
                    echo "   Total: ${totalTests}"
                    echo "   Passed: ${passedTests}"
                    echo "   Failed: ${failedTests}"
                    echo "   Pass Rate: ${passRate.round(2)}%"
                    
                    // Quality gate: Minimum 95% pass rate
                    if (passRate < 95) {
                        error("❌ Quality gate failed: Pass rate ${passRate.round(2)}% is below minimum 95%")
                    } else {
                        echo "✅ Quality gate passed: Pass rate ${passRate.round(2)}%"
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo '📊 Pipeline completed, generating summary...'
            script {
                def summary = """
                📋 Pipeline Summary - Build #${BUILD_NUMBER}
                ═══════════════════════════════════════════
                🌿 Branch: ${env.BRANCH_NAME}
                🎯 Environment: ${params.ENVIRONMENT}
                🌐 Browser: ${params.BROWSER}
                ⏰ Duration: ${currentBuild.durationString}
                📊 Result: ${currentBuild.currentResult}
                """
                echo summary
            }
        }
        
        success {
            echo '✅ Pipeline completed successfully!'
            
            // Slack notification on success
            script {
                if (env.SLACK_WEBHOOK) {
                    slackSend(
                        channel: '#test-automation',
                        color: 'good',
                        webhook: env.SLACK_WEBHOOK,
                        message: """
                        ✅ *Playwright Tests Passed* 
                        🔗 Build: #${BUILD_NUMBER}
                        🌿 Branch: ${env.BRANCH_NAME}
                        🎯 Environment: ${params.ENVIRONMENT}
                        🌐 Browser: ${params.BROWSER}
                        📊 <${BUILD_URL}|View Reports>
                        """.stripIndent()
                    )
                }
            }
        }
        
        failure {
            echo '❌ Pipeline failed!'
            
            // Slack notification on failure
            script {
                if (env.SLACK_WEBHOOK) {
                    slackSend(
                        channel: '#test-automation',
                        color: 'danger',
                        webhook: env.SLACK_WEBHOOK,
                        message: """
                        ❌ *Playwright Tests Failed* 
                        🔗 Build: #${BUILD_NUMBER}
                        🌿 Branch: ${env.BRANCH_NAME}
                        🎯 Environment: ${params.ENVIRONMENT}
                        🌐 Browser: ${params.BROWSER}
                        🔍 <${BUILD_URL}|View Logs>
                        """.stripIndent()
                    )
                }
            }
        }
        
        unstable {
            echo '⚠️ Pipeline completed with warnings!'
        }
        
        cleanup {
            echo '🧹 Cleaning up workspace...'
            cleanWs(
                cleanWhenAborted: true,
                cleanWhenFailure: false,
                cleanWhenNotBuilt: true,
                cleanWhenSuccess: true,
                cleanWhenUnstable: false,
                deleteDirs: true
            )
        }
    }
}