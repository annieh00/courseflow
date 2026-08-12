package com.courseflow.backend.RateMyProfessor;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.*;
import java.util.Map;



@Service
public class RateMyProfessorSchoolService {

    private final String API_URL = "https://www.ratemyprofessors.com/graphql";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String SCHOOL_QUERY = """
        query NewSearchSchoolsQuery($query: SchoolSearchQuery!) {
          newSearch {
            schools(query: $query) {
              edges {
                cursor
                node {
                  id
                  legacyId
                  name
                  city
                  state
                  departments { id name }
                  numRatings
                  avgRatingRounded
                  summary {
                    campusCondition campusLocation careerOpportunities
                    clubAndEventActivities foodQuality internetSpeed
                    libraryCondition schoolReputation schoolSafety
                    schoolSatisfaction socialActivities
                  }
                }
              }
            }
          }
        }
        """;

    public JsonNode searchSchools(String schoolName) {
        try {
            String requestBody = createSchoolRequestBody(schoolName);
            HttpHeaders headers = createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    API_URL, HttpMethod.POST, entity, String.class
            );

            return objectMapper.readTree(response.getBody());

        } catch (Exception e) {
            throw new RuntimeException("Failed to search schools: " + e.getMessage(), e);
        }
    }

    private String createSchoolRequestBody(String schoolName) {
        try {
            Map<String, Object> variables = Map.of(
                    "query", Map.of("text", schoolName)
            );

            Map<String, Object> requestBody = Map.of(
                    "query", SCHOOL_QUERY,
                    "variables", variables
            );

            return objectMapper.writeValueAsString(requestBody);

        } catch (Exception e) {
            throw new RuntimeException("Failed to create school request body", e);
        }
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0");
        headers.set("Accept", "*/*");
        headers.set("Accept-Language", "en-US,en;q=0.5");
        headers.set("Authorization", "Basic dGVzdDp0ZXN0");
        headers.set("Sec-GPC", "1");
        headers.set("Sec-Fetch-Dest", "empty");
        headers.set("Sec-Fetch-Mode", "cors");
        headers.set("Sec-Fetch-Site", "same-origin");
        headers.set("Priority", "u=4");

        return headers;
    }
}