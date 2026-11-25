package com.recepcao.sistema.seguranca;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.TimeUnit;

/**
 * Deixa o navegador guardar os arquivos da Plataforma (o kit visual tem ~1,7 MB).
 * Sem isto vale o padrão do Spring Security, "no-store", e cada tela aberta baixava tudo de novo.
 * As respostas da API continuam sem cache: o Spring Security só põe o "no-store" quando a resposta
 * ainda não tem Cache-Control, e aqui só os arquivos estáticos ganham um.
 */
@Configuration
class CacheDaPlataforma implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Os arquivos do Vite têm um código no nome (index-BSlrrwS2.js): versão nova, nome novo.
        // Então podem ficar guardados por um ano sem o navegador nem perguntar.
        registry.addResourceHandler("/plataforma/assets/**")
                .addResourceLocations("classpath:/static/plataforma/assets/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable());

        // O resto (index.html, kit campbel, fontes) muda sem trocar de nome: o navegador guarda,
        // mas confere a cada uso; se não mudou, o servidor responde 304 e nada é baixado de novo.
        registry.addResourceHandler("/plataforma/**")
                .addResourceLocations("classpath:/static/plataforma/")
                .setCacheControl(CacheControl.noCache());
    }
}
