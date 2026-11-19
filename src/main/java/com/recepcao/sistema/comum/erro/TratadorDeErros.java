package com.recepcao.sistema.comum.erro;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Converte as exceções das APIs em respostas { mensagem, campos }.
 * Vale só para os @RestController: as páginas Thymeleaf tratam os próprios erros.
 */
@RestControllerAdvice(annotations = RestController.class)
public class TratadorDeErros {

    private static final Logger log = LoggerFactory.getLogger(TratadorDeErros.class);

    @ExceptionHandler(NaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public RespostaDeErro naoEncontrado(NaoEncontradoException e) {
        return new RespostaDeErro(e.getMessage());
    }

    @ExceptionHandler(RegraDeNegocioException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public RespostaDeErro regraDeNegocio(RegraDeNegocioException e) {
        return new RespostaDeErro(e.getMessage(), e.getCampos());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public RespostaDeErro camposInvalidos(MethodArgumentNotValidException e) {
        Map<String, String> campos = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(erro -> campos.putIfAbsent(erro.getField(), erro.getDefaultMessage()));
        return new RespostaDeErro("Confira os campos destacados.", campos);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public RespostaDeErro corpoIlegivel(HttpMessageNotReadableException e) {
        return new RespostaDeErro("Os dados enviados estão incompletos ou em formato errado.");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public RespostaDeErro inesperado(Exception e) {
        log.error("Erro inesperado na API", e);
        return new RespostaDeErro("Não foi possível concluir. Tente de novo em instantes.");
    }
}
