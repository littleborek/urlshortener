
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app


COPY pom.xml .
COPY src /app/src


RUN mvn package


RUN ls -1 target/*.jar | head -n 1 > /tmp/jar.name


FROM eclipse-temurin:21-jre-jammy
WORKDIR /app


ARG JAR_NAME
RUN JAR_NAME=$(cat /tmp/jar.name)
ENV JAR_NAME=${JAR_NAME}


COPY --from=builder /app/target/${JAR_NAME} app.jar


ENTRYPOINT ["java","-jar","/app.jar"]