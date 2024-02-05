/* groovylint-disable LineLength */
node {
    app = null
    properties([disableConcurrentBuilds()])

    stage('Set NodeJs') {
        env.NODEJS_HOME = "${tool 'Node-18'}"
        env.PATH="${env.NODEJS_HOME}/bin:${env.PATH}"
        sh 'npm --version'
    }

    stage('Checkout Repository') {
        cleanWs()
        checkout scm
        sh 'git rev-parse --short HEAD > .git/commit-id'

        env.COMMIT_ID = readFile('.git/commit-id').trim()
        env.PROJECT_NAME = (env.JOB_NAME.tokenize('/') as String[])[0]
        env.SONAR_KEY = (env.WORKSPACE.tokenize('/') as String[]).last()
        env.IMAGE_TAG = "synavoshub/${env.PROJECT_NAME}:${commit_id}"
        env.BUILD_TAG = "${env.PROJECT_NAME}-${commit_id}"
        env.GIT_AUTHOR = sh (script: 'git log -1 --pretty=%cn ${GIT_COMMIT}', returnStdout: true).trim()
        env.GIT_COMMIT_MSG = sh (script: 'git log -1 --pretty=%B ${GIT_COMMIT}', returnStdout: true).trim()

        postMattermostReport("started")

        // silent_sh("rm tsconfig.json")
        sh 'rm package-lock.json'
        sh 'rm -rf build'
    }
    try{
        stage('Pulling latest react server'){
            docker.image('synavoshub/react-server-18:latest').pull()
        }

        sh 'printenv'

        stage('Installing dependencies') {
            node_cmd("yarn-i.sh")
        }

        stage('Running Tests') {
            //node_cmd("yarn-test.sh")
        }

        stage('Creating optimized build') {
            if (env.BRANCH_NAME == 'develop') {
                dockerize('build-dev', 'develop');
            }

             if (env.BRANCH_NAME == 'qa') {
                dockerize('build-qa', 'qa');
             }

            if (env.BRANCH_NAME == 'staging') {
                dockerize('build-staging', 'staging');
            }
            if (env.BRANCH_NAME.startsWith('release/')) {
                dockerize('build-prod', "release-${env.COMMIT_ID}")
            }
        }
    }catch (e) {
        currentBuild.result = "FAILURE"
    }finally {
        cleanWs(cleanWhenNotBuilt: false,
            deleteDirs: true,
            disableDeferredWipeout: true,
            notFailBuild: true,
            patterns: [[pattern: '.gitignore', type: 'INCLUDE'],
            [pattern: '.propsfile', type: 'EXCLUDE']])
        if (currentBuild.result == "FAILURE") {

            postMattermostReport("failed")
        }else{
            postMattermostReport("success")

        }
    }
}

void postMattermostReport(String build_flag){
    if (build_flag == "started"){
    mattermostSend (
            color: "#2A42EE",
            message: """Build Started:
            Author: ${env.GIT_AUTHOR}
            Commit Message: ${env.GIT_COMMIT_MSG}
            Repository Name: ${env.JOB_NAME}
            Build : ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Link to build>)"""
            )
    }else if(build_flag == "failed"){
   mattermostSend (
            color: "#e00707",
            message: """Build Failed:
            Author: ${env.GIT_AUTHOR}
            Commit Message: ${env.GIT_COMMIT_MSG}
            Repository Name: ${env.JOB_NAME}
            Build : ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Link to build>)"""
            )
    }else{
   mattermostSend (
            color: "#00f514",
            message: """Build Success:
            Author: ${env.GIT_AUTHOR}
            Commit Message: ${env.GIT_COMMIT_MSG}
            Repository Name: ${env.JOB_NAME}
            Build : ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Link to build>)"""
            )
    }
}

String planName(String jobName) {
    tokens = jobName.tokenize('/') as String[]
    return tokens[0]
}

void node_cmd(command){
    sh "docker run --rm -v ${env.WORKSPACE}:/app synavoshub/react-build-maker-18 /scripts/${command}"
}

void dockerize(build, tag) {
    node_cmd("yarn-run.sh ${build}")
    app = docker.build(env.IMAGE_TAG, '-f Dockerfile ./')

    docker.withRegistry('https://index.docker.io/v1/', 'synavoshub') {
        app.push(tag)
    }

}

String checkSonarStatus(currentBuild, env){
    sh "sleep 20"
    sh "curl -X GET -H 'Accept: application/json' http://sonarqube:9000/api/qualitygates/project_status?projectKey=${env.SONAR_KEY} > status.json"
    def json = readJSON file:'status.json'
    echo "${json.projectStatus.status}"
    if ("${json.projectStatus.status}" == "ERROR") {
        currentBuild.result = 'FAILURE'
        error('SonarQube quality gate failed, please see sonar for details.')
    }
}


void silent_sh(cmd){
    sh "${cmd} || true"
}
