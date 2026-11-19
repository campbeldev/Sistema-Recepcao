package com.recepcao.sistema.seguranca;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new SenhaComMigracao();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login", "/error", "/plataforma", "/plataforma/**", "/api/sessao").permitAll()
                        .requestMatchers("/api/usuarios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/reunioes/**", "/contatos/**").hasRole("ADMIN")
                        .anyRequest().hasAnyRole("ADMIN", "RECEPCIONISTA")
                )
                .formLogin(form -> form
                        .loginPage("/login")
                        .defaultSuccessUrl("/plataforma/", true)
                        .failureUrl("/login?erro")
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutSuccessUrl("/login?saiu")
                        .deleteCookies("JSESSIONID")
                );

        return http.build();
    }
}
