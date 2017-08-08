meta:
  id: import_outer
  endian: le
  license: CC0-1.0
  imports:
    - import_inner
seq:
  - id: items
    type: import_inner
    repeat: expr
    repeat-expr: 3
types:
  item:
    seq:
      - id: value
        type: u4
      - id: inner
        type: import_inner
