const assert = require('assert');
const isoalpha3 = require('./data/countries');

const renditions = {
  '10m': Object.keys(isoalpha3),
  '50m':["ABW","AFG","AGO","AIA","ALB","ALA","AND","ARE","ARG","ARM","ASM","ATA","ashmoreandcartieris","ATF","ATG","AUS","AUT","AZE","BDI","BEL","BEN","BFA","BGD","BGR","BHR","BHS","BIH","BLM","BLR","BLZ","BMU","BOL","BRA","BRB","BRN","BTN","BWA","CAF","CAN","CHE","CHL","CHN","CIV","CMR","COD","COG","COK","COL","COM","CPV","CRI","CUB","CUW","CYM","CYN","CYP","CZE","DEU","DJI","DMA","DNK","DOM","DZA","ECU","EGY","ERI","ESP","EST","ETH","FIN","FJI","FLK","FRA","FRO","FSM","GAB","GBR","GEO","GGY","GHA","GIN","GMB","GNB","GNQ","GRC","GRD","GRL","GTM","GUM","GUY","HKG","HMD","HND","HRV","HTI","HUN","IDN","IMN","IND","indianoceanter","IOT","IRL","IRN","IRQ","ISL","ISR","ITA","JAM","JEY","JOR","JPN","siachenglacier","KAZ","KEN","KGZ","KHM","KIR","KNA","KOR","KOS","KWT","LAO","LBN","LBR","LBY","LCA","LIE","LKA","LSO","LTU","LUX","LVA","MAC","MAF","MAR","MCO","MDA","MDG","MDV","MEX","MHL","MKD","MLI","MLT","MMR","MNE","MNG","MNP","MOZ","MRT","MSR","MUS","MWI","MYS","NAM","NCL","NER","NFK","NGA","NIC","NIU","NLD","NOR","NPL","NRU","NZL","OMN","PAK","PAN","PCN","PER","PHL","PLW","PNG","POL","PRI","PRK","PRT","PRY","PSE","PYF","QAT","ROU","RUS","RWA","ESH","SAU","SDN","SSD","SEN","SGP","SGS","SHN","SLB","SLE","SLV","SMR","somaliland","SOM","SPM","SRB","STP","SUR","SVK","SVN","SWE","SWZ","SXM","SYC","SYR","TCA","TCD","TGO","THA","TJK","TKM","TLS","TON","TTO","TUN","TUR","TWN","TZA","UGA","UKR","URY","USA","UZB","VAT","VCT","VEN","VGB","VIR","VNM","VUT","WLF","WSM","YEM","ZAF","ZMB","ZWE"],
  '110m':["AFG","AGO","ALB","ARE","ARG","ARM","ATA","ATF","AUS","AUT","AZE","BDI","BEL","BEN","BFA","BGD","BGR","BHS","BIH","BLR","BLZ","BOL","BRA","BRN","BTN","BWA","CAF","CAN","CHE","CHL","CHN","CIV","CMR","COD","COG","COL","CRI","CUB","CYN","CYP","CZE","DEU","DJI","DNK","DOM","DZA","ECU","EGY","ERI","ESP","EST","ETH","FIN","FJI","FLK","FRA","GAB","GBR","GEO","GHA","GIN","GMB","GNB","GNQ","GRC","GRL","GTM","GUY","HND","HRV","HTI","HUN","IDN","IND","IRL","IRN","IRQ","ISL","ISR","ITA","JAM","JOR","JPN","KAZ","KEN","KGZ","KHM","KOR","KOS","KWT","LAO","LBN","LBR","LBY","LKA","LSO","LTU","LUX","LVA","MAR","MDA","MDG","MEX","MKD","MLI","MMR","MNE","MNG","MOZ","MRT","MWI","MYS","NAM","NCL","NER","NGA","NIC","NLD","NOR","NPL","NZL","OMN","PAK","PAN","PER","PHL","PNG","POL","PRI","PRK","PRT","PRY","PSE","QAT","ROU","RUS","RWA","ESH","SAU","SDN","SSD","SEN","SLB","SLE","SLV","somaliland","SOM","SRB","SUR","SVK","SVN","SWE","SWZ","SYR","TCD","TGO","THA","TJK","TKM","TLS","TTO","TUN","TUR","TWN","TZA","UGA","UKR","URY","USA","UZB","VEN","VNM","VUT","YEM","ZAF","ZMB","ZWE"],
};

['10m', '50m', '110m'].forEach((rendition) => {
  const index = require(`../countries/${rendition}/index.json`);

  describe(`rendition ${rendition}`, () => {
    it('should have an index', () => {
      assert(index);
    });

    renditions[rendition].forEach((code) => {
      it(`should have ${isoalpha3[code]} (${code}) in the index`, () =>{
        assert(index.all[code]);
      });
    });
  });
})
