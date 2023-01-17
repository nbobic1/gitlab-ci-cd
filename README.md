# NOTE

This is a "fork" of [Classroom reservation website](https://github.com/Lino2007/classroom-reservation-website) github repo used for GitLab CI learning purpose

# Prerequisites

* GitLab account
* Repository with [Classroom reservation website](https://github.com/Lino2007/classroom-reservation-website) code
* GitLab runners configured:
    1. Use GitLab shared runners (Note: it may require user to enter valid credit card for validation to [prevent crypto mining](https://about.gitlab.com/blog/2021/05/17/prevent-crypto-mining-abuse/))
    1. Configure runner on local machine. Follow instructions on Settings -> CI/CD -> Runners
* Completed [terraform-task](https://gitlab.com/kibrovic/terraform-task/-/tree/main)
* ECS cluster `arm_ecs_cluster` along with task definitions and service definitions should already be created using Terraform

# Task

1. Use Terraform to provision ECS cluster `arm_ecs_cluster`
1. Modify `js/db.js` to use environment variable `MYSQL_DB` as database host:
1. Create Dockerfile for Node.js app
1. Create ECS task definition JSON template for Node.js app in `ecs/frontend-task.json`:
    * Template can be found at [AWS ECS documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/create-task-definition-classic.html#task-definition-template) or generated using: `aws ecs register-task-definition --generate-cli-skeleton`
    * JSON template can also be copied from AWS console after manually creating task
    * Set container environment variable `MYSQL_DB_HOST` to use CI/CD environment variable `MYSQL_DB_HOST`
    * Node.js app should be deployed on EC2 instance with Public subnet (check [ECS tasks placement constraints](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-placement-constraints.html))
        * Use environment variable `PUBLIC_SUBNET_ID` for placement constraint
1. Create ECS task definition JSON template for MySQL database in `ecs/database-task.json`:
    * Set environment variables `MYSQL_DATABASE` and `MYSQL_ROOT_PASSWORD`
    * `MYSQL_ROOT_PASSWORD` should use GitLab CI/CD secret
    * Database should be deployed on EC2 instance with Private subnet (check [ECS tasks placement constraints](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-placement-constraints.html))
        * Use environment variable `PRIVATE_SUBNET_ID` for placement constraint
1. Create GitLab CI/CD pipeline which will:
    * Build Node.js docker image and push it to repository (docker hub or ECR)
    * Replace environment variables in task definitions with actual values
        * Use [envsubst](https://linux.die.net/man/1/envsubst), part of `gettext` pkg, to replace environment variables in template for actual values
    * Update ECS services with latest task definitions

### ECS instructions

1. Manually create `frontend-service` and `database-service` using AWS console:
    * Follow steps from [AWS documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started-ecs-ec2.html)
1. Frontend task definition:
    * Use Node.js app docker image build and published in previous step
    * Map containers port to port host's port `80`
    * Set environment variable `MYSQL_DB_HOST` to Private EC2 instance's private IP address
    * Configure CPU/Memory limits
    * Use [placement constraint](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-placement-constraints.html) to deploy task to EC2 instance in public subnet
        * NOTE: At the moment, new ECS console doesn't show placement constraint option and it needs to be configured using JSON config
    * Use `ecs_task_execution_role` for Task role and Task execution role
1. Database task definition:
    * Use [MySql](https://hub.docker.com/_/mysql) docker image
    * Map container port `3306` to host port `3306`
    * Set environment variables for MYSQL_ROOT_PASSWORD and MYSQL_DATABASE
    * Configure CPU/Memory limits
    * Use [placement constraint](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-placement-constraints.html) to deploy task to EC2 instance in private subnet
        * NOTE: At the moment, new ECS console doesn't show placement constraint option and it needs to be configured using JSON config
    * Use `ecs_task_execution_role` for Task role and Task execution role

### GitLab CI/CD

1. Create task definition file templates `ecs/frontend-task.json` and `ecs/database-task.json`:
    * Copy ECS task definition JSON configuration from ECS console 
    * Remove `taskDefinitionArn`, `registeredAt` and `registeredBy` keys from template files
    * Replace specific values with environment variable placeholders. These values will be set in CI/CD phase:
        * `image` with `${REPOSITORY_URL}`
        * `taskRoleArn` and `taskRoleArn` with `${CI_AWS_TASK_EXECUTION_ROLE}`
        * Placement constraints subnet value with `${PUBLIC_SUBNET_ID}` for frontend task and `${PRIVATE_SUBNET_ID}` for database task
        * [FRONTEND] `MYSQL_DB_HOST` value with `${MYSQL_DB_HOST}` environment variable
        * [DATABASE] `MYSQL_DATABASE` value with `${MYSQL_DATABASE}` environment variable
        * [DATABASE] `MYSQL_ROOT_PASSWORD` value with `${MYSQL_ROOT_PASSWORD}` environment variable
1. Add GitLab secrets in Settings -> CI/CD -> Variables
    * AWS_ACCESS_KEY_ID 
    * AWS_DEFAULT_REGION
    * AWS_SECRET_ACCESS_KEY
    * DOCKER_PASSWORD for private docker hub repository access
    * DOCKER_USER for private docker hub repository access 
    * MYSQL_ROOT_PASSWORD for database configuration
1. Create `.gitlab-ci.yml` for CI/CD pipeline configuration:
    * Define two stages: `build` and `deploy`
    * Build stage should use Docker-in-Docker (dind) image (https://docs.gitlab.com/ee/ci/services/#using-services-with-docker-run-docker-in-docker-side-by-side)
    * Deploy stage should use AWS optimized GitLab image `registry.gitlab.com/gitlab-org/cloud-deploy/aws-ecs:latest` (https://docs.gitlab.com/ee/ci/cloud_deployment/#use-an-image-to-run-aws-commands)
    * Build stage should have one job `build_frontend` with steps which:
        * Log in to docker hub using credentials `DOCKER_USER` and `DOCKER_PASSWORD`
        * Build Node.js app dockerfile
        * Publish image to docker hub
    * Deploy stage should have two jobs `deploy_frontend` and `deploy_backend` with steps which:
        * Substitute environment variables in `ecs/*json` templates with actual values
        * Register new task definition using generated json file
        * Update ECS service with latest task definition
    * Each job should have required variables defined:
        * [Variables reference](https://docs.gitlab.com/ee/ci/yaml/#variables)
    * Define when pipeline should be triggered (on push, merge request, manual etc):
        * Use [rules](https://docs.gitlab.com/ee/ci/yaml/#rules) to include or exclude jobs

### Tips

Environment variables are a set of dynamic named values stored within the system that is used by applications:
* Linux/Unix environment variables: https://www.geeksforgeeks.org/environment-variables-in-linux-unix/
* Node.js environment variables: https://nodejs.dev/en/learn/how-to-read-environment-variables-from-nodejs/

A Dockerfile is a text document that contains all the commands a user could call on the command line to assemble an image:
* [Dockerfile references](https://docs.docker.com/engine/reference/builder/)
* Consider using smaller [node-alpine base image](https://hub.docker.com/_/node)

Amazon Elastic Container Service (Amazon ECS) is a highly scalable and fast container management service. You can use it to run, stop, and manage containers on a cluster:
* A task definition is like a blueprint for your application. Each time that you launch a task in Amazon ECS, you specify a task definition
* An Amazon ECS service helps you to run and maintain a specified number of instances of a task definition
* Manual steps to create ECS cluster with task definitions and services can be found at https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started-ecs-ec2.html

GitLab CI/CD allows 400 minutes/month using shared runners. Local runners don't have limit:
* GitLab secrets can be set in Settings -> CI/CD -> Variables
* Use [envsubst](https://linux.die.net/man/1/envsubst), part of `gettext` package, to replace environment variables in template for actual values:
    * e.g. `envsubst < ecs/$CI_AWS_ECS_TASK_DEFINITION_FILE > $OUTPUT_FILE`
* Use `aws-cli` to get values for environment variables:
    * `PUBLIC_SUBNET_ID` and `PRIVATE_SUBNET_ID` can be obtained using `aws ec2 describe-subnets`. Check [describe-subnets](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/ec2/describe-subnets.html) for more info
    * `MYSQL_DB_HOST` is private IP address of Private EC2 instance. It's private IP can be obtained using `aws ec2 describe-instances`. Check [describe-instances](https://docs.aws.amazon.com/cli/latest/reference/ec2/describe-instances.html) for usage info
    * `CI_AWS_TASK_EXECUTION_ROLE` can be obtained using `aws iam get-role`. Check [get-role](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/iam/get-role.html) for usage info
* Use `aws-cli` to update ECS task definitions and services:
    * ECS [register-task-definition](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/ecs/register-task-definition.html)
    * ECS [update-service](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/ecs/update-service.html)
* Don't Repeat Yourself (DRY)! Consider using YAML anchors, includes, extends and !reference to reuse configurations:
    * [YAML optimization](https://docs.gitlab.com/ee/ci/yaml/yaml_optimization.html)

## Teacher Guide

1. Explain GitLab CI/CD:
    * CI/CD idea, concept, use cases, examples
    * Software release lifecycle, branching strategy (e.g. git flow)
    * What is pipeline, stage, job
    * Basic pipeline example 
    * Explain variables and secrets in GitLab (protect, mask secrets)
    * Explain triggers (e.g. how it fits CI/CD process)
1. Environment variables:
    * What are env vars
    * What's their purpose and when to use (e.g. database username, password, host)
    * Use cases
1. ECS:
    * Reminder about cluster, task definition and service (should be already explained in [terraform-task](https://gitlab.com/kibrovic/terraform-task/-/tree/main#teacher-guide))
    * Help students create manual task definitions (note the placement constraint change in new console)
    * Help students create task definition template and replace environment variables with actual values (this can be done on local devices)
    * Explain issues with database deployment
1. Rest of task should be a homework
