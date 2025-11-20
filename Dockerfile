
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app


ENV MAVEN_OPTS="-Xmx256m"

COPY pom.xml .
RUN mvn dependency:go-offline
COPY src /app/src
RUN mvn package -DskipTests


RUN mv $(find target -maxdepth 1 -name "*.jar" | head -1) target/app.jar

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app


COPY --from=builder /app/target/app.jar /app/app.jar


ENTRYPOINT ["java", "-jar", "/app/app.jar"]