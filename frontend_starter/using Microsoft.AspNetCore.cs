using Microsoft.AspNetCore.Mvc;
using backend.Dtos;
using backend.Models.Pagination;
using System;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VisitController : ControllerBase
    {
        private readonly backend.Services.IVisitService _service;

        public VisitController(backend.Services.IVisitService service)
        {
            _service = service;
        }

        // GET paginé : /api/Visit?pageNumber=1&pageSize=5
        [HttpGet]
        public async Task<IActionResult> GetVisit([FromQuery] PaginationParams pagination)
        {
            var result = await _service.GetAllAsync(pagination);
            return Ok(result);
        }

        // GET: /api/Visit/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetVisit(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            return result is null ? NotFound() : Ok(result);
        }

        // POST : créer une visite
        [HttpPost]
        public async Task<IActionResult> CreateVisit([FromBody] VisitCreateUpdateDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var created = await _service.CreateAsync(dto);
            return Ok(created);
        }

        // PUT : modifier une visite
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVisit(Guid id, [FromBody] VisitCreateUpdateDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var updated = await _service.UpdateAsync(id, dto);
            return updated ? Ok() : NotFound();
        }

        // DELETE : supprimer une visite
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVisit(Guid id)
        {
            var deleted = await _service.DeleteAsync(id);
            return deleted ? Ok() : NotFound();
        }
    }
}
