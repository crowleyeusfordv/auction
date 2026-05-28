from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from pydantic.aliases import AliasChoices, AliasGenerator


def input_aliases(field_name: str) -> AliasChoices:
    return AliasChoices(field_name, to_camel(field_name))


def query_aliases(field_name: str) -> AliasChoices:
    return AliasChoices(field_name, to_camel(field_name))


SNAKE_ALIAS_GENERATOR = AliasGenerator(
    validation_alias=input_aliases,
)


def snake_config(**overrides) -> ConfigDict:
    return ConfigDict(
        alias_generator=SNAKE_ALIAS_GENERATOR,
        populate_by_name=True,
        **overrides,
    )


class SnakeModel(BaseModel):
    model_config = snake_config()
