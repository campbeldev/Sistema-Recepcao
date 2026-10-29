package com.recepcao.sistema;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling //Adicionei isso para a verificação de uma em uma hora
public class SistemaRecepcaoApplication {

    public static void main(String[] args) {
        SpringApplication.run(SistemaRecepcaoApplication.class, args);
    }

}
