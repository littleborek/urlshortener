
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app


ENV MAVEN_OPTS="-Xmx256m"

COPY pom.xml .
RUN mvn dependency:go-offline
COPY src /app/src

RUN mvn package -DskipTests


RUN JAR_FILE=$(find target -maxdepth 1 -name "*.jar" -not -name "original-*.jar" | head -1) && \
    if [ "$JAR_FILE" != "target/app.jar" ]; then mv "$JAR_FILE" target/app.jar; fi


FROM eclipse-temurin:21-jre-jammy
WORKDIR /app


EXPOSE 8080

COPY --from=builder /app/target/app.jar /app/app.jar


ENTRYPOINT ["java", "-Xmx380m", "-Xms380m", "-Dserver.port=8080", "-Dserver.address=0.0.0.0", "-jar", "/app/app.jar"]