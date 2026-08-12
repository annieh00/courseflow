package com.courseflow.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// If you use Lombok you can do @RequiredArgsConstructor instead of constructor below
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    // @Bean
    // public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    // http
    // .cors(cors -> {})
    // .authorizeHttpRequests(authz -> authz
    // // access to endpoints here only
    // .requestMatchers("/api/**").permitAll()
    // .requestMatchers("/ratemyprofessor/professors/search**").permitAll()
    // .requestMatchers("/ratemyprofessor/school").permitAll()
    // .requestMatchers("/actuator/health").permitAll()
    // .requestMatchers("/error").permitAll()
    // .requestMatchers("/swagger-ui.html").permitAll()
    // .requestMatchers("/courses/addCourse").permitAll()
    // .requestMatchers("/courses/search/{Course_num}").permitAll()
    // .requestMatchers("/courses/search").permitAll()
    // .requestMatchers("/courses/{id}").permitAll()
    // .requestMatchers("/courses/{id}/delete").permitAll()
    // // everything else is secured
    // // All other endpoints require authentication
    // .anyRequest().authenticated()
    // )
    // .csrf(csrf -> csrf.disable()); // Disable CSRF for API testing

    // return http.build();
    // }
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CHANGE 1: Explicitly use the source defined below
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // CHANGE 2: explicitly allow OPTIONS requests for preflight checks
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()

                        // Your existing allow-list
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN") //protects all admin endpoints
                        .requestMatchers("/api/users/**").authenticated()
                        .requestMatchers("/test/**").permitAll()
                        .requestMatchers("/api/**").permitAll()
                        .requestMatchers("/ratemyprofessor/**").permitAll() // Simplified wildcard
                        .requestMatchers("/courses/**").permitAll() // Simplified wildcard
                        .requestMatchers("/actuator/health", "/error", "/swagger-ui.html").permitAll()
                        .requestMatchers("/coursePlan/**").permitAll()
                        // swagger stuff
                        .requestMatchers(
                                "/docs",
                                "/docs/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        // All other endpoints require authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

        // Note: You defined 'jwtAuthFilter' at the top but didn't use it here.
        // If you need JWTs later, you'll need to uncomment the line below:
        // .addFilterBefore(jwtAuthFilter,
        // org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:8081",
                "http://localhost:3000",
                "http://localhost:19006",
                "http://localhost:19000",
                "https://sdmay26-48.ece.iastate.edu"));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
