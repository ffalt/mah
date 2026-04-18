# Docker Image

This is a Docker image for Mah.

## Quick Start

To use the image, you need to have [Docker](https://docs.docker.com/get-docker/) installed. 

Run the following command to start the container:

```bash
docker run -d -p 8080:80 ffalt/mah
```

Then open [http://localhost:8080](http://localhost:8080).

# Port configuration

Change the port in the run command. E.g. port 9090

```bash
docker run -d -p 9090:80 ffalt/mah
```

## Notes

The `Dockerfile` in this folder is part of the build setup and not to be used directly.
