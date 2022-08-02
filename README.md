# Crane UI - OpenShift Dynamic Plugin

**NOTE: This repository is brand new and under active prerelease development.**

The Crane UI plugin provides a UI for constructing container migration pipelines within the OpenShift console.

It is provided as an OpenShift Console dynamic plugin which requires OpenShift 4.11 or greater.

You can run the plugin using a local development environment or build an image to deploy it to a cluster.

## Local development

You'll need:

- Node.js 16+ and Yarn 1.x installed
- Python and [jq](https://stedolan.github.io/jq/download/) installed (for the start-console.sh setup script)
- An OpenShift 4.11+ cluster (the Console UI will run locally, but it needs a real cluster on the backend)

### To set up for local development:

1. Install dependencies on your cluster. You can install them by installing the [crane-operator](https://github.com/konveyor/crane-operator), or manually:

   - Install the **Red Hat OpenShift Pipelines** operator from OperatorHub
   - Deploy [crane-reverse-proxy](https://github.com/konveyor/crane-reverse-proxy) including its dev-only route:

     ```sh
     oc create -f https://raw.githubusercontent.com/konveyor/crane-reverse-proxy/main/config/dev/namespace.yaml
     oc create -f https://raw.githubusercontent.com/konveyor/crane-reverse-proxy/main/config/default/deployment.yaml
     oc create -f https://raw.githubusercontent.com/konveyor/crane-reverse-proxy/main/config/default/service.yaml
     oc create -f https://raw.githubusercontent.com/konveyor/crane-reverse-proxy/main/config/rbac/serviceAccount.yaml
     oc create -f https://raw.githubusercontent.com/konveyor/crane-reverse-proxy/main/config/rbac/role.yaml
     oc create -f https://raw.githubusercontent.com/konveyor/crane-reverse-proxy/main/config/rbac/clusterRole.yaml
     oc create -f https://raw.githubusercontent.com/konveyor/crane-reverse-proxy/main/config/rbac/roleBinding.yaml
     oc create -f https://raw.githubusercontent.com/konveyor/crane-reverse-proxy/main/config/rbac/clusterRoleBinding.yaml
     oc create -f https://raw.githubusercontent.com/konveyor/crane-reverse-proxy/main/config/dev/route.yaml
     ```

   - Deploy [crane-secret-service](https://github.com/konveyor/crane-secret-service) including its dev-only route:

     ```sh
     oc create -f https://raw.githubusercontent.com/konveyor/crane-secret-service/main/config/default/deployment.yaml
     oc create -f https://raw.githubusercontent.com/konveyor/crane-secret-service/main/config/default/service.yaml
     oc create -f https://raw.githubusercontent.com/konveyor/crane-secret-service/main/config/dev/route.yaml
     ```

2. Clone and build the [openshift/console](https://github.com/openshift/console) repository in a separate directory.

   ```sh
   git clone https://github.com/openshift/console.git
   cd console
   ./build.sh
   ```

### To run the plugin locally:

1. From the `crane-ui-plugin` directory:

   ```sh
   yarn install  # Install dependencies
   yarn build    # Build the plugin, generating output to `dist` directory
   yarn start    # Start an HTTP server hosting the generated assets on port 9001
   ```

   The plugin module server runs on port 9001 with CORS enabled.

2. In a second terminal window, also from the `crane-ui-plugin` directory:

   _(NOTE: replace `../console` below with the path to your clone of the [openshift/console](https://github.com/openshift/console) repository if it is located elsewhere)_

   ```sh
   # `oc login` to your cluster, and then:
   yarn start-console ../console
   ```

   This script will configure an OAuth client and run the console with auth enabled.

3. Open the Console in your browser at http://localhost:9000/ and log in.

4. Find our UI in the following locations on the OpenShift Console's Developer perspective:
   - On the Add page, click one of the actions in the "Import Existing Application" card.
   - In the left-side nav, click "Imported Applications".

## Docker image

Before you can deploy your plugin on a cluster, you must build an image and push it to an image registry.

1. Build the image:

   ```sh
   docker build -t quay.io/yourname/crane-ui-plugin:latest .
   ```

2. Run the image:

   ```sh
   docker run -it --rm -d -p 9001:8080 quay.io/yourname/crane-ui-plugin:latest
   ```

3. Push the image:

   ```sh
   docker push quay.io/yourname/crane-ui-plugin:latest
   ```

## Deployment on cluster

Console dynamic plugins are supposed to be deployed via [OLM operators](https://github.com/operator-framework).
However, the plugin can also be deployed manually as follows.

After pushing an image with your changes to a registry, you can deploy the
plugin to a cluster by instantiating the provided
[OpenShift template](template.yaml). It will run a light-weight nginx HTTP
server to serve your plugin's assets.

```sh
oc process -f template.yaml \
  -p PLUGIN_NAME=crane-ui-plugin \
  -p NAMESPACE=openshift-migration-toolkit \
  -p IMAGE=quay.io/yourname/crane-ui-plugin:latest \
  | oc create -f -
```

Once deployed, patch the
[Console operator](https://github.com/openshift/console-operator)
config to enable the plugin.

```sh
oc patch consoles.operator.openshift.io cluster \
  --patch '{ "spec": { "plugins": ["crane-ui-plugin"] } }' --type=merge
```

## References

- [Console Dynamic Plugin SDK README](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk)
- [Console Dynamic Plugins feature page](https://github.com/openshift/enhancements/blob/master/enhancements/console/dynamic-plugins.md)
- [Customization Plugin Example](https://github.com/spadgett/console-customization-plugin)

The structure of this repository is based on [spadgett/console-plugin-template](https://github.com/spadgett/console-plugin-template).
