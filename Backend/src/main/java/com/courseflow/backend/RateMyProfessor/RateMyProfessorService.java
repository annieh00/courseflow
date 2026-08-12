package com.courseflow.backend.RateMyProfessor;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

@Service
public class RateMyProfessorService {

    private final String API_URL = "https://www.ratemyprofessors.com/graphql";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // GraphQL query
    private final String TEACHER_QUERY = """
    query TeacherSearchResultsPageQuery(
      $query: TeacherSearchQuery!
      $schoolID: ID
      $includeSchoolFilter: Boolean!
    ) {
      search: newSearch {
        ...TeacherSearchPagination_search_1ZLmLD
      }
      school: node(id: $schoolID) @include(if: $includeSchoolFilter) {
        __typename
        ... on School {
          name
        }
        id
      }
    }
    
    fragment TeacherSearchPagination_search_1ZLmLD on newSearch {
      teachers(query: $query, first: 8, after: "") {
        didFallback
        edges {
          cursor
          node {
            ...TeacherCard_teacher
            id
            __typename
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        resultCount
        filters {
          field
          options {
            value
            id
          }
        }
      }
    }
    
    fragment TeacherCard_teacher on Teacher {
      id
      legacyId
      avgRating
      numRatings
      ...CardFeedback_teacher
      ...CardSchool_teacher
      ...CardName_teacher
      ...TeacherBookmark_teacher
    }
    
    fragment CardFeedback_teacher on Teacher {
      wouldTakeAgainPercent
      avgDifficulty
    }
    
    fragment CardSchool_teacher on Teacher {
      department
      school {
        name
        id
      }
    }
    
    fragment CardName_teacher on Teacher {
      firstName
      lastName
    }
    
    fragment TeacherBookmark_teacher on Teacher {
      id
      isSaved
    }
    """;

    public JsonNode searchProfessors(String professorName, String schoolId) {
        try {
            String requestBody = createRequestBody(professorName, schoolId);
            HttpHeaders headers = createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    API_URL, HttpMethod.POST, entity, String.class
            );

            // parsed JSON response
            return objectMapper.readTree(response.getBody());

        } catch (Exception e) {
            throw new RuntimeException("Failed to search professors: " + e.getMessage(), e);
        }
    }

    private String createRequestBody(String professorName, String schoolId) {
        try {
            Map<String, Object> variables = new HashMap<>();
            Map<String, Object> query = new HashMap<>();
            query.put("text", professorName);
            query.put("schoolID", schoolId);
            query.put("fallback", true);
            query.put("departmentID", null);

            variables.put("query", query);
            variables.put("schoolID", schoolId);
            variables.put("includeSchoolFilter", true);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("query", TEACHER_QUERY);
            requestBody.put("variables", variables);

            return objectMapper.writeValueAsString(requestBody);

        } catch (Exception e) {
            throw new RuntimeException("Failed to create request body", e);
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