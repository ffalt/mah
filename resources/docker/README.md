# Build your own Mah Docker Setup

Run Mah in a Docker container using nginx. To use the official Mah image, see [Docker Image](../docker-image/README.md).

## Quick Start

Download the [Dockerfile](./Dockerfile) to your local machine.
In the same directory, build and run the Docker container:

```bash
docker build -t mah .
docker run -d -p 8080:80 mah
```

Then open [http://localhost:8080](http://localhost:8080).

## Customization

Override the version at build time:

```bash
docker build --build-arg MAH_VERSION=1.19.0 -t mah .
```

Change the port to your liking:

```bash
docker run -d -p 9090:80 mah
```
