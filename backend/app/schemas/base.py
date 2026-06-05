from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from pydantic.aliases import AliasChoices

def input_aliases(field_name: str) -> AliasChoices:
    return AliasChoices(field_name, to_camel(field_name))

def query_aliases(field_name: str) -> AliasChoices:
    return AliasChoices(field_name, to_camel(field_name))

# We keep the old names (snake_config/SnakeModel) so we don't break existing imports,
# but we change the behavior to output camelCase by default.

def snake_config(**overrides) -> ConfigDict:
    return ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        **overrides,
    )

class SnakeModel(BaseModel):
    model_config = snake_config()
