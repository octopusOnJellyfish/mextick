
const EventEmitter = require('./EventEmitter');
const fs = require('fs');
const nlines = require('n-readlines');

// BitMEX trade csv columns
const TIMESTAMP=0, SYMBOL=1, SIDE=2, SIZE=3, PRICE=4;
const TICK_DIR=5, TRADE_ID=6, GROSS_VAL=7, HOME_NOT=8, FOREIGN_NOT=9;


class Tick extends EventEmitter {

    constructor( directory ) {
        super();

        this.index = -1;
        this.symbol = '';
        this.path = directory;

        this.reader = null;        

        this.files = fs.readdirSync( directory );

        // Get CSV files only, exclude zipped copies and sort the files assuming correctly dated filenames as provided by BitMEX
        this.files = ( this.files.filter( f => f.includes('.csv') && !f.includes('.csv.gz') ) ).sort();

        this.lastemit = null;

        this.nozeroes = true;

        

    }

    _next( ) {
        return this.index < this.files.length-1 
                ? new nlines( `${this.path}/${this.files[ ++this.index ]}` ) 
                : false;
    }

    get _isfinal() { return this.index == this.files.length - 1; }

    start( symbol ) {
        
        let line;

        // Iterate all files in the directory 
        while ( this.reader = this._next() ) {

            // Iterate all lines in the file
            while (line = this.reader.next()) {
                let text = line.toString('ascii');
                
                if ( text.includes( symbol )) { 
                    let cells = text.split(',');

                    let em = {
                        timestamp: new Date( Date.parse( cells[ TIMESTAMP ].replace('D', 'T') )), // 'D'/'T' Don't ask me why, I have no idea 
                        symbol: cells[ SYMBOL ],
                        price: Number( cells[ PRICE ] ),
                        side: cells[ SIDE ],
                        tick: cells[ TICK_DIR ]
                    }

                    if ( em.tick.includes('Zero') && this.nozeroes ) {
                        // Do nothing, logic is easier for my chimp brain this way.
                    } else { 

                        this.emit( 'tick', em );

                    }


                }
            }       
                            
        }
        
    }

    stop() {

    }
}

module.exports = Tick;
