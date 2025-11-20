
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src /app/src
RUN mvn package -DskipTests


RUN find target -maxdepth 1 -name "*.jar" -print -quit > /tmp/app.jar.name

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app


COPY --from=builder /tmp/app.jar.name /tmp/app.jar.name


ARG JAR_NAME
RUN JAR_NAME=$(cat /tmp/app.jar.name)
ENV JAR_NAME=${JAR_NAME}


COPY --from=builder /app/target/app.jar /app/app.jar

ENTRYPOINT ["java", "-jar", "/app/app.jar"]