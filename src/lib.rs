use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

const RESERVED: usize = 8;

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug)]
pub enum Cell {
    Alive = 1,
    Dead = 0,
}

#[wasm_bindgen]
pub struct Line {
    sim_length: usize,
    cells: Vec<Cell>,
}

#[wasm_bindgen]
impl Line {
    pub fn tick(&mut self) {
        let mut prev_state = Cell::Dead;
        let mut current_state;

        for i in RESERVED..(RESERVED + self.sim_length) {
            let left = if i == RESERVED { Cell::Dead } else { self.cells[i - 1] };
            let right = if i == (RESERVED + self.sim_length - 1) { Cell::Dead } else { self.cells[i + 1] };

            current_state = match (left, self.cells[i], right) {
                (Cell::Alive, Cell::Alive, Cell::Alive) => self.cells[0],
                (Cell::Alive, Cell::Alive, Cell::Dead) => self.cells[1],
                (Cell::Alive, Cell::Dead, Cell::Alive) => self.cells[2],
                (Cell::Alive, Cell::Dead, Cell::Dead) => self.cells[3],
                (Cell::Dead, Cell::Alive, Cell::Alive) => self.cells[4],
                (Cell::Dead, Cell::Alive, Cell::Dead) => self.cells[5],
                (Cell::Dead, Cell::Dead, Cell::Alive) => self.cells[6],
                (Cell::Dead, Cell::Dead, Cell::Dead) => self.cells[7],
            };

            if i == RESERVED {
                prev_state = current_state;
                continue;
            }

            self.cells[i - 1] = prev_state;
            prev_state = current_state;
        }
        self.cells[RESERVED + self.sim_length - 1] = prev_state;
    }

    pub fn new() -> Line {
        let sim_length = 100;
        let total_length = RESERVED + sim_length;
        let mut cells = vec![Cell::Dead; total_length];

        let default_rule = 30;
        for i in 0..RESERVED {
            let bit = (default_rule >> (7 - i)) & 1;
            cells[i] = if bit == 1 { Cell::Alive } else { Cell::Dead };
        }

        let middle = RESERVED + sim_length / 2;
        cells[middle] = Cell::Alive;

        Line {
            sim_length,
            cells,
        }
    }

    pub fn change_rule(&mut self, rule: u8) {
        for i in 0..RESERVED {
            let bit = (rule >> (7 - i)) & 1;
            self.cells[i] = if bit == 1 { Cell::Alive } else { Cell::Dead };
        }
    }

    pub fn set_length(&mut self, sim_length: usize) {
        self.sim_length = sim_length;
        let total_length = RESERVED + sim_length;
        let mut new_cells = vec![Cell::Dead; total_length];
        
        for i in 0..RESERVED {
            new_cells[i] = self.cells[i];
        }
        self.cells = new_cells;
    }

    pub fn length(&self) -> usize {
        self.sim_length
    }

    pub fn cells(&self) -> *const Cell {
        unsafe { self.cells.as_ptr().add(RESERVED) }
    }
}

#[wasm_bindgen]
pub fn get_memory_buffer() -> js_sys::Uint8Array {
    let mem = wasm_bindgen::memory();
    let memory: js_sys::WebAssembly::Memory = mem.unchecked_into();
    let buffer = memory.buffer();
    js_sys::Uint8Array::new(&buffer)
}